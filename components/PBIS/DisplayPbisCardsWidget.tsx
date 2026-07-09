interface Person {
  name: string;
}

interface PbisCard {
  id: string;
  dateGiven: string;
  // Student cards carry a `teacher`; staff cards carry a `giver`.
  teacher?: Person;
  giver?: Person;
  category: string;
  cardMessage: string;
}

interface DisplayPbisCardsWidgetProps {
  cards: PbisCard[];
  title?: string;
}

export default function DisplayPbisCardsWidget({
  cards,
  title = 'Recent PBIS Cards',
}: DisplayPbisCardsWidgetProps) {
  return (
    <>
      <h3 style={{ textAlign: 'center' }}>{title}</h3>
      <div className="flex flex-wrap justify-center items-start w-auto gap-4">
        {cards.map((card) => {
          const date = new Date(card.dateGiven).toLocaleDateString();
          const from = card.teacher?.name || card.giver?.name || 'Unknown';
          return (
            <div
              key={card.id}
              className="flex flex-wrap items-center justify-around w-full text-white bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] rounded-2xl p-4 m-2 min-w-[300px] max-w-[500px]"
            >
              <p className="mx-auto text-center text-lg">
                {from} - {card.category.toUpperCase()}
              </p>
              <p className="mx-auto text-center text-lg">
                {card.cardMessage} - {date}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
