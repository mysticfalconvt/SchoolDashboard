import React, { useMemo } from 'react';
import { useUser } from '../User';
import PbisFalcon from './PbisFalcon';

interface PbisCard {
  id: string;
  dateGiven: string;
  cardMessage: string;
  category: string;
  teacher: {
    name: string;
  };
}

interface User {
  isStaff?: boolean;
  isStudent?: boolean;
  isParent?: boolean;
  studentPbisCards?: PbisCard[];
  PbisCardCount?: number;
  YearPbisCount?: number;
  teacherPbisCardCount?: number;
  teacherYearPbisCount?: number;
}

interface PbisWidgetProps {
  initialCardCount?: number;
}

export default function PbisWidget({ initialCardCount = 0 }: PbisWidgetProps) {
  const me = useUser() as User;
  const isStaff = me?.isStaff || false;
  const isStudent = me?.isStudent || false;
  const isParent = me?.isParent || false;
  const PBISCards = useMemo(
    () =>
      me?.studentPbisCards
        ?.filter((card) => !!card.cardMessage)
        .sort(
          (a, b) =>
            new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime(),
        )
        .slice(0, 20) || [],
    [me?.studentPbisCards],
  );
  const [card, setCard] = React.useState<PbisCard | undefined>(
    PBISCards[PBISCards.length - 1],
  );
  const date = new Date(card?.dateGiven || '').toLocaleDateString();

  React.useEffect(() => {
    const interval = setInterval(
      () => {
        const randomCard =
          PBISCards[Math.floor(Math.random() * PBISCards.length)];
        setCard(randomCard);
      },
      // 1 second
      5000,
    );
    return () => clearInterval(interval);
  }, [PBISCards]);

  let weekCards = 0;
  let yearCards = 0;
  if (me?.isStudent) {
    weekCards = me?.PbisCardCount || 0;
    yearCards = me?.YearPbisCount || 0;
  }
  if (me?.isStaff) {
    weekCards = me?.teacherPbisCardCount || 0;
    yearCards = me?.teacherYearPbisCount || 0;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: isStudent && !!card ? '500px' : '300px',
        height: '100%',
        backgroundColor: 'var(--blue)',
        borderRadius: '10px',
        border: '3px solid var(--red)',
        padding: '5px',
        margin: '5px',
      }}
    >
      {me?.isStaff || me?.isStudent ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p
            style={{
              margin: '2px',
              whiteSpace: 'nowrap',
            }}
          >
            Week - {weekCards}
          </p>
          <p
            style={{
              margin: '2px',
              whiteSpace: 'nowrap',
            }}
          >
            Year - {yearCards}
          </p>
        </div>
      ) : null}
      <PbisFalcon initialCount={initialCardCount} />
      {isStudent && !!card && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '5px',
            alignItems: 'space-between',
          }}
          key={card?.id}
        >
          <div style={{ textAlign: 'center' }}>
            {card?.teacher?.name} - {card?.category?.toUpperCase()}
          </div>
          <div style={{ textAlign: 'center' }}>
            {card?.cardMessage} - {date}
          </div>
        </div>
      )}
    </div>
  );
}
