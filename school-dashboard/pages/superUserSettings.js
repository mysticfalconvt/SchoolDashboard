import AddBirthdays from "../components/Birthdays/AddBirthdays";
import CreateChromebookAssignments from "../components/Chromebooks/CreateChromebookAssignments";
import NewWeeklyPbisCollection from "../components/PBIS/NewWeeklyPbisCollection";
import TransferData from "../components/TransferData";
// import StudentFocusTable from '../components/StudentFocusTable';
import { useUser } from "../components/User";
import GradientButton from "../components/styles/Button";
import NewStudent from "../components/users/CreateNewStudent";
import NewEvents from "../components/users/NewEvents";
import NewStaff from "../components/users/NewStaff";
import NewUpdateUsers from "../components/users/NewUpdateUsers";
import isAllowed from "../lib/isAllowed";

export default function SuperUserSettings() {
  const me = useUser();
  return (
    <div>
      <h1>Administration</h1>
      {isAllowed(me, "isSuperAdmin") && (
        <GradientButton
          onClick={() => window.open("https://api.ncujhs.tech", "_blank")}
        >
          API Backend (Be careful in here)
        </GradientButton>
      )}
      {isAllowed(me, "isSuperAdmin") && <NewStudent />}
      {isAllowed(me, "isSuperAdmin") && <NewUpdateUsers />}
      {isAllowed(me, "isSuperAdmin") && <NewStaff />}
      {isAllowed(me, "isSuperAdmin") && <NewEvents />}
      {/* {isAllowed(me, "isSuperAdmin") && <AddBirthdays />} */}
      {isAllowed(me, "canManagePbis") && <NewWeeklyPbisCollection />}
      {/* {isAllowed(me, "isSuperAdmin") && <CreateChromebookAssignments />} */}
      {/* {isAllowed(me, "isSuperAdmin") && <TransferData />} */}
    </div>
  );
}
