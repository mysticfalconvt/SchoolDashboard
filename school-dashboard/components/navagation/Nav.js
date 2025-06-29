import Link from "next/link";
import { FaHome } from "react-icons/fa";
import { useUser } from "../User";
import isAllowed from "../../lib/isAllowed";
import { useRouter } from "next/router";
import { callbackDisabled, disciplineDisabled } from "../../config";
import MagicLinkSignIn from "../loginComponents/MagicLinkSignIn";

export default function Nav({ mobile = false, onClickLink }) {
  const me = useUser();
  const router = useRouter();

  // check if path is /reset
  const isReset = router.pathname.includes("/reset");
  if (isReset) {
    return null;
  }

  if (!me) {
    return <MagicLinkSignIn />;
  }

  // Helper to render a nav link in a skewed card
  const NavCard = ({ href, children }) => (
    <div
      className={
        mobile
          ? "bg-gradient-to-tl from-[var(--blue)] to-[var(--red)] rounded-lg my-2 w-full flex items-center justify-center skew-x-[-20deg] shadow transition-transform duration-200 hover:brightness-110 hover:shadow-lg"
          : "bg-gradient-to-tl from-[var(--blue)] to-[var(--red)] rounded-lg mx-1 min-w-[90px] h-10 flex items-center justify-center skew-x-[-20deg] shadow transition-transform duration-200 hover:brightness-110 hover:shadow-lg"
      }
    >
      <Link href={href} passHref legacyBehavior>
        <a
          className={
            mobile
              ? "uppercase font-bold text-white text-center px-4 py-3 block text-lg skew-x-[20deg] whitespace-nowrap w-full"
              : "uppercase font-bold text-white text-center px-2 py-1 block text-base skew-x-[20deg] whitespace-nowrap"
          }
          onClick={mobile && onClickLink ? onClickLink : undefined}
        >
          {children}
        </a>
      </Link>
    </div>
  );

  if (mobile) {
    return (
      <div className="flex flex-col items-stretch w-full p-2">
        <NavCard href="/calendar">Calendar</NavCard>
        <NavCard href="/links">Links</NavCard>
        <NavCard href="/pbis">PBIS</NavCard>
        {isAllowed(me, "hasTA") && <NavCard href={`/taPage/${me?.id}`}>TA</NavCard>}
        {isAllowed(me, "hasClasses") && !callbackDisabled && (
          <NavCard href="/callback">Callback</NavCard>
        )}
        {isAllowed(me, "isStaff") && <NavCard href="/users">Users</NavCard>}
        {isAllowed(me, "isStaff") && !disciplineDisabled && (
          <NavCard href="/discipline">Discipline</NavCard>
        )}
        {isAllowed(me, "isStaff") && <NavCard href="/chromebooks">Chromebook</NavCard>}
        {isAllowed(me, "canHaveSpecialGroups") && <NavCard href="/specialGroup">SpGroup</NavCard>}
        <NavCard href="/ePortfolio">E-Portfolio</NavCard>
        {isAllowed(me, "isSuperAdmin") && <NavCard href="/superUserSettings">⚙️</NavCard>}
      </div>
    );
  }

  return (
    <nav className="flex flex-row items-center justify-end w-full px-2 py-1 flex-wrap">
      {/* Home icon for mobile */}
      <div className="md:hidden mr-1">
        <NavCard href="/">
          <FaHome />
        </NavCard>
      </div>
      <div className="flex flex-row flex-wrap items-center justify-end w-full">
        <NavCard href="/calendar">Calendar</NavCard>
        <NavCard href="/links">Links</NavCard>
        <NavCard href="/pbis">PBIS</NavCard>
        {isAllowed(me, "hasTA") && <NavCard href={`/taPage/${me?.id}`}>TA</NavCard>}
        {isAllowed(me, "hasClasses") && !callbackDisabled && (
          <NavCard href="/callback">Callback</NavCard>
        )}
        {isAllowed(me, "isStaff") && <NavCard href="/users">Users</NavCard>}
        {isAllowed(me, "isStaff") && !disciplineDisabled && (
          <NavCard href="/discipline">Discipline</NavCard>
        )}
        {isAllowed(me, "isStaff") && <NavCard href="/chromebooks">Chromebook</NavCard>}
        {isAllowed(me, "canHaveSpecialGroups") && <NavCard href="/specialGroup">SpGroup</NavCard>}
        <NavCard href="/ePortfolio">E-Portfolio</NavCard>
        {isAllowed(me, "isSuperAdmin") && <NavCard href="/superUserSettings">⚙️</NavCard>}
      </div>
    </nav>
  );
}
