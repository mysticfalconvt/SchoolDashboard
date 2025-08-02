import { NextPage } from 'next';

const ThemeTest: NextPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8 text-[var(--textColor)]">
        Theme Test Page
      </h1>

      {/* Test basic Tailwind classes */}
      <div className="p-6 bg-[var(--tableAccentColor)] rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-[var(--textColor)]">
          Custom CSS Variables Test
        </h2>
        <p className="text-[var(--textColor)]">
          This should use custom CSS variables for styling.
        </p>
      </div>

      {/* Test standard Tailwind classes */}
      <div className="p-6 border-2 border-[var(--red)] rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-[var(--textColor)]">
          Border Test
        </h2>
        <p className="text-[var(--textColor)]">
          This should have a red border.
        </p>
      </div>

      {/* Test background colors */}
      <div className="p-6 bg-[var(--blueTrans)] rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-[var(--textColor)]">
          Background Test
        </h2>
        <p className="text-[var(--textColor)]">
          This should have a blue transparent background.
        </p>
      </div>

      {/* Test Tailwind utility classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="p-4 bg-[var(--red)] text-white rounded-lg hover:opacity-80 transition-opacity">
          Red Button
        </button>
        <button className="p-4 bg-[var(--blue)] text-white rounded-lg hover:opacity-80 transition-opacity">
          Blue Button
        </button>
      </div>

      {/* Test standard Tailwind classes */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Tailwind Dark Mode Test</h3>
        <p className="text-gray-800 dark:text-gray-200">
          This should show different colors in light/dark mode.
        </p>
      </div>

      {/* Test basic utility classes */}
      <div className="mt-8 p-4 bg-blue-500 text-white rounded">
        <h3 className="text-lg font-semibold mb-2">Basic Tailwind Test</h3>
        <p>This should have a blue background and white text.</p>
      </div>
    </div>
  );
};

export default ThemeTest;
