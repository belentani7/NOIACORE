import { notFound } from "next/navigation";
import { SHADERS } from "@/lib/shaders";
import { EmbedClient } from "./EmbedClient";

// Esta página es un embed minimalista: solo el canvas del shader,
// sin navbar/footer/overlays. Ideal para iframes externos.
export async function generateStaticParams() {
  return SHADERS.map((s) => ({ shader: s.id }));
}

export const dynamicParams = true;

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ shader: string }>;
}) {
  const { shader: shaderParam } = await params;
  const shader = SHADERS.find(
    (s) => s.id === shaderParam || s.name.toLowerCase() === shaderParam.toLowerCase()
  );
  if (!shader) notFound();

  return <EmbedClient shaderId={shader.id} />;
}
