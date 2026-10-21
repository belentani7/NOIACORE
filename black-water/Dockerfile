FROM node:22-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8099

WORKDIR /srv/noiacore
COPY --chown=node:node . .

USER node
EXPOSE 8099

HEALTHCHECK --interval=30s --timeout=4s --start-period=8s --retries=3 \
  CMD node -e "require('node:http').get('http://127.0.0.1:8099/',r=>{r.resume();process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "server.cjs"]
