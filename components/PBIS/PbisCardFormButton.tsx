import useCreateMessage from '@/components/Messages/useCreateMessage';
import SearchForUserName from '@/components/SearchForUserName';
import GradientButton, {
  SmallGradientButton,
} from '@/components/styles/Button';
import { Dialog, DialogContent } from '@/components/styles/Dialog';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useState } from 'react';
import toast from 'react-hot-toast';

// Students may give at most this many PBIS cards per day.
const DAILY_STUDENT_CARD_LIMIT = 3;

const CREATE_PBIS_CARD = gql`
  mutation CREATE_QUICK_PBIS(
    $teacher: ID!
    $student: ID!
    $category: String
    $message: String
  ) {
    createPbisCard(
      data: {
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
        category: $category
        cardMessage: $message
      }
    ) {
      id
      student {
        name
      }
      teacher {
        name
      }
    }
  }
`;

// Count of staff cards a student has already given since the given time.
// Students only ever give staff cards, so this is their full daily total.
const STUDENT_CARDS_GIVEN_SINCE = gql`
  query STUDENT_CARDS_GIVEN_SINCE($giver: ID!, $since: DateTime!) {
    staffPbisCardsCount(
      where: {
        giver: { id: { equals: $giver } }
        dateGiven: { gte: $since }
      }
    )
  }
`;

const CREATE_STAFF_PBIS_CARD = gql`
  mutation CREATE_STAFF_PBIS_CARD(
    $giver: ID!
    $recipient: ID!
    $message: String
    $category: String
  ) {
    createStaffPbisCard(
      data: {
        giver: { connect: { id: $giver } }
        recipient: { connect: { id: $recipient } }
        cardMessage: $message
        category: $category
      }
    ) {
      id
      recipient {
        name
      }
    }
  }
`;

interface FormInputs {
  message: string;
  category?: string;
  studentName?: string;
}

interface User {
  id: string;
  name: string;
  isStaff?: boolean;
  isStudent?: boolean;
}

interface StudentUser {
  userId: string;
  userName: string;
}

interface CardFormProps {
  isOpen: boolean;
  onClose: () => void;
}

function CardForm({ isOpen, onClose }: CardFormProps) {
  const { inputs, handleChange, resetForm } = useForm({
    message: '',
    category: '',
  });
  const me = useUser() as User;
  const teacher = me?.id;
  const [studentCardIsFor, setStudentCardIsFor] = useState<
    StudentUser | undefined
  >();
  // Students may only give cards to staff. Staff can toggle between giving a
  // regular card to a student or a staff card to another staff member.
  const isStudentGiver = !!me?.isStudent && !me?.isStaff;
  const [recipientType, setRecipientType] = useState<'isStudent' | 'isStaff'>(
    isStudentGiver ? 'isStaff' : 'isStudent',
  );
  const isStaffCard = recipientType === 'isStaff';

  // Use mutateAsync so a rejected mutation is caught below (mutate() never
  // rejects, which previously let a failed card still show a success toast).
  const [, { mutateAsync: createCard }] = useGqlMutation(CREATE_PBIS_CARD);
  const [, { mutateAsync: createStaffCard }] =
    useGqlMutation(CREATE_STAFF_PBIS_CARD);
  const createMessage = useCreateMessage();

  // Start of today (local), computed once per mount so the query key is stable.
  const [startOfToday] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  });

  // How many cards this student has already given today. Only relevant (and
  // only fetched) for student givers while the dialog is open.
  const { data: cardsTodayData } = useGQLQuery(
    'studentCardsGivenToday',
    STUDENT_CARDS_GIVEN_SINCE,
    { giver: teacher, since: startOfToday },
    { enabled: isOpen && isStudentGiver && !!teacher },
  );
  const cardsGivenToday = cardsTodayData?.staffPbisCardsCount ?? 0;
  const atDailyLimit =
    isStudentGiver && cardsGivenToday >= DAILY_STUDENT_CARD_LIMIT;

  const clearRecipient = () => {
    setStudentCardIsFor(undefined);
    handleChange({
      target: { name: 'studentName', value: '' },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const messageMissing = !inputs.message || inputs.message.trim() === '';
  // A category is always required. Staff cards additionally require a comment.
  const missingFields = isStaffCard
    ? !studentCardIsFor || !inputs.category || messageMissing
    : !studentCardIsFor || !inputs.category;
  const submitDisabled = missingFields || atDailyLimit;

  const handleGiveCard = async () => {
    if (!studentCardIsFor) return;
    if (atDailyLimit) {
      toast.error(
        `You've already given ${DAILY_STUDENT_CARD_LIMIT} PBIS cards today.`,
      );
      return;
    }
    try {
      if (isStaffCard) {
        await createStaffCard({
          giver: teacher,
          recipient: studentCardIsFor.userId,
          message: inputs.message,
          category: inputs.category,
        });
      } else {
        await createCard({
          teacher,
          student: studentCardIsFor.userId,
          message: inputs.message,
          category: inputs.category,
        });
      }
      await createMessage({
        subject: isStaffCard ? 'New Staff PBIS Card' : 'New PBIS Card',
        message: inputs.message,
        receiver: studentCardIsFor.userId || '',
        link: '',
      });
      toast.success(`Gave ${studentCardIsFor.userName} a PBIS card`);
      clearRecipient();
      onClose();
    } catch (err: any) {
      // Surface backend validation errors (daily limit / missing comment).
      toast.error(err?.message || 'Could not give the PBIS card.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="New PBIS Card"
      variant="modal"
      size="md"
      maxHeight="80vh"
    >
      <DialogContent maxHeight="max-h-[70vh]" className="p-4">
        <div className="space-y-4">
          <div className="mb-2">
            <p className="text-white/80 text-sm">
              {isStaffCard
                ? 'Create a PBIS card for a staff member (a comment is required)'
                : 'Create a PBIS card for a student'}
            </p>
          </div>

          {/* Daily limit warning for students */}
          {isStudentGiver &&
            (atDailyLimit ? (
              <div className="rounded-lg border border-red-400/60 bg-red-500/20 p-3 text-sm text-white">
                You&apos;ve already given {DAILY_STUDENT_CARD_LIMIT} PBIS cards
                today. You can give more tomorrow.
              </div>
            ) : (
              <div className="rounded-lg border border-white/20 bg-white/10 p-3 text-sm text-white/90">
                You&apos;ve given {cardsGivenToday} of{' '}
                {DAILY_STUDENT_CARD_LIMIT} PBIS cards today.
              </div>
            ))}

          {/* Staff can choose to card a student or a staff member */}
          {!isStudentGiver && (
            <div className="flex justify-center gap-2">
              <SmallGradientButton
                type="button"
                onClick={() => {
                  setRecipientType('isStudent');
                  clearRecipient();
                }}
                style={recipientType === 'isStudent' ? {} : { opacity: 0.5 }}
              >
                Give to Student
              </SmallGradientButton>
              <SmallGradientButton
                type="button"
                onClick={() => {
                  setRecipientType('isStaff');
                  clearRecipient();
                }}
                style={recipientType === 'isStaff' ? {} : { opacity: 0.5 }}
              >
                Give to Staff
              </SmallGradientButton>
            </div>
          )}

          <div className="bg-base-200/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <div className="space-y-6">
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text text-white font-medium text-base">
                    {isStaffCard ? 'Select Staff' : 'Select Student'}
                  </span>
                </label>
                <SearchForUserName
                  key={recipientType}
                  name="studentName"
                  value={inputs.studentName}
                  updateUser={setStudentCardIsFor}
                  userType={recipientType}
                  excludeSelf
                />
              </div>

              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text text-white font-medium text-base">
                    Message
                  </span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder={isStaffCard ? 'Message for staff' : 'Student Message'}
                  value={inputs.message}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)] resize-none min-h-[5rem]"
                />
              </div>

              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text text-white font-medium text-base">
                    Category
                  </span>
                </label>
                <div className="flex flex-wrap gap-4 justify-center text-white font-semibold w-full">
                  <label className="label cursor-pointer flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="radio"
                      name="category"
                      value="respect"
                      checked={inputs.category === 'respect'}
                      onChange={handleChange}
                      className="radio radio-sm"
                      style={{
                        accentColor: '#760D08',
                        borderColor: '#760D08',
                      }}
                    />
                    <span className="label-text text-white font-semibold">
                      Respect
                    </span>
                  </label>
                  <label className="label cursor-pointer flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="radio"
                      name="category"
                      value="responsibility"
                      checked={inputs.category === 'responsibility'}
                      onChange={handleChange}
                      className="radio radio-sm"
                      style={{
                        accentColor: '#760D08',
                        borderColor: '#760D08',
                      }}
                    />
                    <span className="label-text text-white font-semibold">
                      Responsibility
                    </span>
                  </label>
                  <label className="label cursor-pointer flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="radio"
                      name="category"
                      value="perseverance"
                      checked={inputs.category === 'perseverance'}
                      onChange={handleChange}
                      className="radio radio-sm"
                      style={{
                        accentColor: '#760D08',
                        borderColor: '#760D08',
                      }}
                    />
                    <span className="label-text text-white font-semibold">
                      Perseverance
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-2 pt-4 border-t border-white/10">
            <SmallGradientButton
              type="button"
              disabled={submitDisabled}
              onClick={handleGiveCard}
            >
              Give {studentCardIsFor && `${studentCardIsFor.userName} `}A PBIS
              Card
            </SmallGradientButton>

            <button
              type="button"
              onClick={onClose}
              className="text-white font-medium border border-white/30 rounded-xl px-4 py-2 hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PbisCardFormButtonProps {
  teacher: User;
}

export default function PbisCardFormButton({
  teacher,
}: PbisCardFormButtonProps) {
  const [displayCardForm, setDisplayCardForm] = useState(false);
  return (
    <div className="p-5 flex transition-all duration-1000">
      <GradientButton
        onClick={() => {
          setDisplayCardForm(true);
        }}
      >
        PBIS CARD
      </GradientButton>
      <CardForm
        isOpen={displayCardForm}
        onClose={() => setDisplayCardForm(false)}
      />
    </div>
  );
}
