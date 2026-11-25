import { ConnectionStatus } from '@/components/ConnectionStatus';

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Delivery Tracker</h1>
      <ConnectionStatus />
    </main>
  );
}
