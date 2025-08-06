import { NextPage } from 'next';

const TailwindTest: NextPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-blue-600">Tailwind Test</h1>
      <div className="mt-4 p-4 bg-red-500 text-white rounded">
        <p>This should have a red background and white text.</p>
      </div>
      <div className="mt-4 p-4 bg-green-500 text-white rounded">
        <p>This should have a green background and white text.</p>
      </div>
      <div className="mt-4 p-4 bg-blue-500 text-white rounded shadow-lg">
        <p>This should have a blue background with shadow.</p>
      </div>
    </div>
  );
};

export default TailwindTest;
