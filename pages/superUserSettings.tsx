import type { NextPage } from 'next';
import NewWeeklyPbisCollection from '../components/PBIS/NewWeeklyPbisCollection';
import PickStaffWinners from '../components/PBIS/PickStaffWinners';
import SendPbisWinnerEmails from '../components/PBIS/SendPbisWinnerEmails';
// import StudentFocusTable from '../components/StudentFocusTable';
import { useUser } from '../components/User';
import GradientButton from '../components/styles/Button';
import BulkCompleteOldCallbacks from '../components/Callback/BulkCompleteOldCallbacks';
import NewStudent from '../components/users/CreateNewStudent';
import CreateParentAccountsFromCSV from '../components/users/CreateParentAccountsFromCSV';
import NewEvents from '../components/users/NewEvents';
import NewStaff from '../components/users/NewStaff';
import NewUpdateUsers from '../components/users/NewUpdateUsers';
import isAllowed from '../lib/isAllowed';

const SuperUserSettings: NextPage = () => {
  const me = useUser();
  return (
    <div>
      <h1>Administration</h1>
      {isAllowed(me, 'isSuperAdmin') && (
        <GradientButton
          onClick={() => window.open('https://api.ncujhs.tech', '_blank')}
        >
          API Backend (Be careful in here)
        </GradientButton>
      )}
      {isAllowed(me, 'isSuperAdmin') && <NewStudent />}
      {isAllowed(me, 'isSuperAdmin') && <NewUpdateUsers />}
      {isAllowed(me, 'isSuperAdmin') && <NewStaff />}
      {isAllowed(me, 'isSuperAdmin') && <CreateParentAccountsFromCSV />}
      {isAllowed(me, 'isSuperAdmin') && <NewEvents />}
      {isAllowed(me, 'isSuperAdmin') && <BulkCompleteOldCallbacks />}
      {/* {isAllowed(me, "isSuperAdmin") && <AddBirthdays />} */}
      {isAllowed(me, 'canManagePbis') && <NewWeeklyPbisCollection />}
      {isAllowed(me, 'canManagePbis') && <PickStaffWinners />}
      {isAllowed(me, 'canManagePbis') && <SendPbisWinnerEmails />}
      {/* {isAllowed(me, "isSuperAdmin") && <CreateChromebookAssignments />} */}
      {/* {isAllowed(me, "isSuperAdmin") && <TransferData />} */}
    </div>
  );
};

export default SuperUserSettings;
