export const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) throw new Error(`${name} is missing in apps/web/.env`);

  return value;
};
