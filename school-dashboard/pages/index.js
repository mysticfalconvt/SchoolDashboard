import Head from 'next/head';
import styled from 'styled-components';
import WeeklyCalendar from '../components/calendars/WeeklyCalendar';
import StudentCallbacks from '../components/Callback/StudentCallbacks';
import TeacherDashboard from '../components/dashboard/TeacherDashboard';
import SignOut from '../components/loginComponents/SignOut';
import HomePageLinks from '../components/navagation/HomePageLinks';
import { useUser } from '../components/User';
import isAllowed from '../lib/isAllowed';

const DashboardContainerStyles = styled.div`
  display: flex;
  flex-wrap: nowrap;
  @media (max-width: 650px) {
    flex-wrap: wrap;
  }
`;

export default function Home() {
  const me = useUser();
  return (
    <div>
      <main>
        <HomePageLinks me={me} />
        <DashboardContainerStyles>
          <WeeklyCalendar me={me} />
          {me?.role?.some((role) => role.name === 'staff') && (
            <TeacherDashboard teacher={me} />
          )}
          {me && isAllowed(me, 'student') && <StudentCallbacks />}
        </DashboardContainerStyles>
      </main>

      <footer>
        <SignOut />
      </footer>
    </div>
  );
}
