import { NUMBER_OF_BLOCKS } from "../../config";

export default function AssignmentViewCards({ assignments }) {
  return (
    <div className="flex flex-col text-center border-2 border-[var(--blue)] rounded-3xl m-2.5 justify-around w-full">
      <h3 className="m-2">Current Class Assignments</h3>
      <div className="grid grid-cols-10 md:grid-cols-1">
        {[...Array(NUMBER_OF_BLOCKS)].map((e, i) => {
          const num = i + 1;
          const today = new Date();
          const messageDate = new Date(
            assignments[`block${num}AssignmentLastUpdated`] || ""
          );
          const newUpdate = today - messageDate < 86400000;
          return (
            <div
              className={`flex flex-col m-2 p-2 rounded-3xl shadow-[2px_2px_var(--blue)] bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] text-xl ${newUpdate ? "needsUpdate bg-gradient-to-tr from-[var(--red)] to-[var(--redTrans)] bg-[length:400%_400%] shadow-[2px_2px_var(--red)]" : ""
                }`}
              key={`key ${num}`}
            >
              <h4>Block {num}</h4>
              <p>{assignments[`block${num}ClassName`]}</p>
              <p>{assignments[`block${num}Assignment`]}</p>
              {/* <p>
                {
                  new Date(assignments[`block${num}AssignmentLastUpdated`])
                    .toLocaleString()
                    .split(',')[0]
                }
              </p> */}
            </div>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes AnimationName {
          0% {
            background-position: 0% 57%;
          }
          50% {
            background-position: 100% 44%;
          }
          100% {
            background-position: 0% 57%;
          }
        }
        .needsUpdate {
          animation: AnimationName 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
