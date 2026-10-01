// Hosts de imagem aceitos: alimenta o `images.remotePatterns` do next.config e a
// validação do cadastro de produtos. Uma lista aberta ("**") transformaria o
// /_next/image em proxy para qualquer URL. Para um host novo, adicione aqui.
export const IMAGE_HOSTS = [
  "images.unsplash.com",
  "m.media-amazon.com",
] as const;
