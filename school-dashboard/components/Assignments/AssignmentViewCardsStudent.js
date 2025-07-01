import { NUMBER_OF_BLOCKS } from "../../config";

export default function AssignmentViewCardsStudent({ student }) {
  return (
    <div className="flex flex-col text-center border-2 border-[var(--blue)] rounded-3xl m-2.5 justify-around w-full">
      <h3 className="m-2">Current Class Assignments</h3>
      <div className="grid grid-cols-1 md:grid-cols-10">
        {[...Array(NUMBER_OF_BLOCKS)].map((e, i) => {
          const num = i + 1;
          if (!student[`block${num}Teacher`]) {
            return (
              <div
                className="flex flex-col m-2 p-2 rounded-3xl shadow-[2px_2px_var(--blue)] bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] text-xl"
                key={`key for student - ${student.id} - ${num}`}
              />
            );
          }
          const today = new Date();
          const messageDate = new Date(
            student[`block${num}Teacher`][`block${num}AssignmentLastUpdated`] ||
            ""
          );
          const newUpdate = today - messageDate < 164000000;
          return (
            <div
              className={`flex flex-col m-2 p-2 rounded-3xl shadow-[2px_2px_var(--blue)] bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] text-xl ${newUpdate ? "needsUpdate bg-gradient-to-tr from-[var(--red)] to-[var(--redTrans)] bg-[length:400%_400%] shadow-[2px_2px_var(--red)]" : ""
                }`}
              key={`key for student - ${student.id} - ${num}`}
            >
              <h4>Block {num}</h4>
              <p>{student[`block${num}Teacher`].name}</p>
              <p>{student[`block${num}Teacher`][`block${num}ClassName`]}</p>
              <p>{student[`block${num}Teacher`][`block${num}Assignment`]}</p>
              <p>
                {
                  new Date(
                    student[`block${num}Teacher`][
                    `block${num}AssignmentLastUpdated`
                    ]
                  )
                    .toLocaleString()
                    .split(",")[0]
                }
              </p>
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
