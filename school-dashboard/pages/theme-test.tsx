import type { NextPage } from 'next';

const ThemeTest: NextPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8 text-[var(--textColor)]">
        Theme System Test
      </h1>

      <div className="space-y-6">
        <div className="p-6 bg-[var(--tableAccentColor)] rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--textColor)]">
            Background Test
          </h2>
          <p className="text-[var(--textColor)]">
            This card should have a different background color in light vs dark
            mode.
          </p>
        </div>

        <div className="p-6 border-2 border-[var(--red)] rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--textColor)]">
            Border Test
          </h2>
          <p className="text-[var(--textColor)]">
            This card has a red border that should be consistent across themes.
          </p>
        </div>

        <div className="p-6 bg-[var(--blueTrans)] rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--textColor)]">
            Blue Background Test
          </h2>
          <p className="text-[var(--textColor)]">
            This card has a semi-transparent blue background.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 bg-[var(--red)] text-white rounded-lg hover:opacity-80 transition-opacity">
            Red Button
          </button>
          <button className="p-4 bg-[var(--blue)] text-white rounded-lg hover:opacity-80 transition-opacity">
            Blue Button
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Tailwind Dark Mode Test</h3>
        <p className="text-gray-800 dark:text-gray-200">
          This section uses Tailwind's dark mode classes directly. The
          background and text should change automatically.
        </p>
      </div>
    </div>
  );
};

export default ThemeTest;
