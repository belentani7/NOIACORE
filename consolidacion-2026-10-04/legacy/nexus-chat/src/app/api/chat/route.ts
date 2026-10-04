import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';
import { auditLog } from '@/lib/audit';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// POST /api/chat - Streaming chat with SSE
export async function POST(req: NextRequest) {
  try {
    // CIBERSEGURIDAD: Rate limiting para prevenir abuso del LLM
    const ip = getClientIp(req);
    const rl = checkRateLimit(ip, 'chat');
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Límite de peticiones excedido',
          retryAfter: rl.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rl.retryAfter || 60),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rl.resetTime),
          },
        }
      );
    }

    const body = await req.json();
    const {
      conversationId,
      messages,
      systemPrompt,
      temperature = 0.7,
      enableSearch = false,
      searchResults,
    } = body as {
      conversationId?: string;
      messages: ChatMessage[];
      systemPrompt?: string;
      temperature?: number;
      enableSearch?: boolean;
      searchResults?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const conversation = conversationId
      ? await db.conversation.findUnique({ where: { id: conversationId } })
      : null;

    const settings = await db.userSettings.findUnique({
      where: { id: 'default' },
    });

    const finalSystemPrompt =
      systemPrompt ||
      conversation?.systemPrompt ||
      settings?.systemPrompt ||
      'You are Nexus AI, a helpful, knowledgeable and friendly AI assistant. Respond in the user\'s language. Use markdown formatting when appropriate.';

    let augmentedSystemPrompt = finalSystemPrompt;
    if (enableSearch && searchResults) {
      augmentedSystemPrompt = `${finalSystemPrompt}\n\nYou have access to the following web search results. Use them to provide accurate, up-to-date information. Cite sources by mentioning the website name when relevant.\n\nWeb Search Results:\n${searchResults}`;
    }

    const sdkMessages: ChatMessage[] = [
      { role: 'assistant', content: augmentedSystemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'system' ? ('assistant' as const) : m.role,
        content: m.content,
      })),
    ];

    const zai = await ZAI.create();

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent({ type: 'start', timestamp: Date.now() });

          // AUDITORÍA: Registrar uso del LLM (RGPD art. 30 - registro de actividades)
          await auditLog({
            action: 'CREATE',
            resource: 'message',
            resourceId: conversationId,
            req,
            metadata: {
              type: 'chat_completion',
              messageCount: sdkMessages.length,
              enableSearch,
              temperature,
            },
          });

          // Call SDK with stream: true - it returns a ReadableStream
          const responseStream = (await zai.chat.completions.create({
            messages: sdkMessages,
            thinking: { type: 'disabled' },
            temperature,
            stream: true,
          } as unknown as { stream: true })) as ReadableStream<Uint8Array>;

          let fullResponse = '';
          let buffer = '';

          const reader = responseStream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;

              if (trimmed.startsWith('data:')) {
                const dataStr = trimmed.slice(5).trim();

                // Check for stream end
                if (dataStr === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(dataStr);
                  // Extract content from various possible paths
                  const delta =
                    parsed?.choices?.[0]?.delta?.content ||
                    parsed?.choices?.[0]?.message?.content ||
                    parsed?.choices?.[0]?.text ||
                    '';

                  if (delta) {
                    fullResponse += delta;
                    sendEvent({ type: 'delta', content: delta });
                  }
                } catch {
                  // Not valid JSON, skip
                }
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr !== '[DONE]') {
                try {
                  const parsed = JSON.parse(dataStr);
                  const delta =
                    parsed?.choices?.[0]?.delta?.content ||
                    parsed?.choices?.[0]?.message?.content ||
                    '';
                  if (delta) {
                    fullResponse += delta;
                    sendEvent({ type: 'delta', content: delta });
                  }
                } catch {
                  // ignore
                }
              }
            }
          }

          // If no content was streamed, try a non-streaming fallback
          if (!fullResponse) {
            try {
              const fallback = (await zai.chat.completions.create({
                messages: sdkMessages,
                thinking: { type: 'disabled' },
                temperature,
              })) as { choices?: Array<{ message?: { content?: string } }> };

              const fallbackContent = fallback?.choices?.[0]?.message?.content || '';
              if (fallbackContent) {
                fullResponse = fallbackContent;
                sendEvent({ type: 'delta', content: fallbackContent });
              }
            } catch (fallbackError) {
              console.error('Fallback chat error:', fallbackError);
            }
          }

          sendEvent({
            type: 'done',
            fullResponse,
            timestamp: Date.now(),
          });
          controller.close();
        } catch (error) {
          console.error('Streaming chat error:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          sendEvent({ type: 'error', error: errorMessage });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Chat failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
