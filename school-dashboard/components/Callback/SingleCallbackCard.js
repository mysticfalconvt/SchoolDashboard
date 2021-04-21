import Link from 'next/link';
import styled from 'styled-components';
import { useUser } from '../User';

const SingleCardStyles = styled.div`
  background: linear-gradient(to top left, var(--redTrans), var(--blueTrans));
  margin: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  font-size: 1.2rem;
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
  h1 {
    margin: 0.5rem 1rem;
  }
  p {
    margin: 0rem 1rem 1rem 1rem;
  }
`;

export default function SingleCallbackCard({ callback }) {
  const me = useUser();
  const dateAssigned = new Date(callback.dateAssigned).toLocaleDateString();
  const completed = callback.dateCompleted
    ? `Completed on ${new Date(callback.dateCompleted).toLocaleDateString()}`
    : 'Incomplete';
  return (
    <Link href={`/callback/${callback.id}`}>
      <SingleCardStyles>
        <h1>{callback.title}</h1>
        <p>
          {callback.teacher.id === me.id ? '' : `${callback.teacher.name} -- `}{' '}
          {dateAssigned}
        </p>
        <p>
          {callback.student.id === me.id ? '' : `${callback.student.name} -- `}{' '}
          {completed}
        </p>
        <p>{callback.description}</p>
        <fieldset>
          <p>
            Student:
            <span> {callback.messageFromStudent}</span>
          </p>
          <p>
            Teacher:
            <span> {callback.messageFromTeacher}</span>
          </p>
        </fieldset>
      </SingleCardStyles>
    </Link>
  );
}
