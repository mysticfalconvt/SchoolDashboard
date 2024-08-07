import Link from "next/link";
import { FaHome } from "react-icons/fa";
import NavStyles from "../styles/NavStyles";
import { useUser } from "../User";
import SignIn from "../loginComponents/SignIn";
import isAllowed from "../../lib/isAllowed";
import MessagesCount from "../Messages/MessagesCount";
import { useRouter } from "next/router";
import { callbackDisabled, disciplineDisabled } from "../../config";
import MagicLinkSignIn from "../loginComponents/MagicLinkSignIn";

export default function Nav() {
  const me = useUser();
  const router = useRouter();

  // console.log("me",me);
  // check if path is /reset
  const isReset = router.pathname.includes("/reset");
  // console.log("isReset",isReset);
  if (isReset) {
    return null;
  }

  if (!me) {
    return <MagicLinkSignIn />;
  }
  return (
    <NavStyles>
      {true && (
        <>
          <Link legacyBehavior href="/">
            <a className="home">
              <FaHome />
            </a>
          </Link>
          <Link href="/calendar">Calendar</Link>
          <Link href="/links">Links</Link>
          <Link href="/pbis">PBIS</Link>
          {isAllowed(me, "hasTA") && <Link href={`/taPage/${me?.id}`}>TA</Link>}
          {isAllowed(me, "hasClasses") && !callbackDisabled && (
            <Link href="/callback">Callback</Link>
          )}
          {isAllowed(me, "isStaff") && <Link href="/users">Users</Link>}
          {isAllowed(me, "isStaff") && !disciplineDisabled && (
            <Link href="/discipline">Discipline</Link>
          )}
          {isAllowed(me, "isStaff") && (
            <Link href="/chromebooks">Chromebook</Link>
          )}
          {isAllowed(me, "canHaveSpecialGroups") && (
            <Link href="/specialGroup">SpGroup</Link>
          )}
          <Link href="/ePortfolio">E-Portfolio</Link>
          {isAllowed(me, "isSuperAdmin") && (
            <Link href="/superUserSettings">⚙️</Link>
          )}
          {/* {isAllowed(me, "canManagePbis") && <Link href="/birthdays">🧁</Link>} */}
        </>
      )}
    </NavStyles>
  );
}
