process.loadEnvFile();

export const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) throw new Error(`${name} is missing in apps/server/.env`);

  return value;
};
