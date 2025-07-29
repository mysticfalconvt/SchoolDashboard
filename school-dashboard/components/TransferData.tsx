import { gql } from 'graphql-tag';
import React from 'react';
import { GraphQLClient } from '../lib/graphqlClient';
import GradientButton from './styles/Button';
// import {users} from "../users"
// import {callbacks}  from "../callbacks"

const inputEndPoint = 'http://localhost:4000/api/graphql';
const outPutEndPoint = 'http://localhost:3000/api/graphql';

interface DisciplineItem {
  student: {
    email: string;
  };
  teacher: {
    email: string;
  };
  date?: string;
  teacherComments?: string;
  adminComments?: string;
  classType?: string;
  location?: string;
  timeOfDay?: string;
  addressed?: string;
  inappropriateLanguage?: boolean;
  physicalConduct?: boolean;
  nonCompliance?: boolean;
  disruption?: boolean;
  propertyMisuse?: boolean;
  otherConduct?: boolean;
  VerbalWarning?: boolean;
  buddyRoom?: boolean;
  conferenceWithStudent?: boolean;
  ParentContact?: boolean;
  PlanningRoomReferral?: boolean;
  FollowupPlan?: boolean;
  LossOfPrivilege?: boolean;
  DetentionWithTeacher?: boolean;
  IndividualizedInstruction?: boolean;
  GuidanceReferral?: boolean;
  ReferToAdministrator?: boolean;
  OtherAction?: boolean;
  none?: boolean;
  peers?: boolean;
  teacherInvolved?: boolean;
  substitute?: boolean;
  unknown?: boolean;
  othersInvolved?: boolean;
  [key: string]: any;
}

interface User {
  id: string;
  name: string;
  email: string;
  preferredName?: string;
  canManageCalendar?: boolean;
  canManageUsers?: boolean;
  canSeeOtherUsers?: boolean;
  canManageLinks?: boolean;
  canManageDiscipline?: boolean;
  canSeeAllDiscipline?: boolean;
  canSeeAllTeacherEvents?: boolean;
  canSeeStudentEvents?: boolean;
  canSeeOwnCallback?: boolean;
  canSeeAllCallback?: boolean;
  hasTA?: boolean;
  hasClasses?: boolean;
  isStudent?: boolean;
  isParent?: boolean;
  isStaff?: boolean;
  isTeacher?: boolean;
  isGuidance?: boolean;
  isSuperAdmin?: boolean;
  canManagePbis?: boolean;
  callbackCount?: number;
  totalCallbackCount?: number;
  PbisCardCount?: number;
  YearPbisCount?: number;
  teacherSubject?: string;
  taPbisCardCount?: number;
  averageTimeToCompleteCallback?: number;
  block1Assignment?: string;
  block1ClassName?: string;
  block1AssignmentLastUpdated?: string;
  block2Assignment?: string;
  block2ClassName?: string;
  block2AssignmentLastUpdated?: string;
  block3Assignment?: string;
  block3ClassName?: string;
  block3AssignmentLastUpdated?: string;
  block4Assignment?: string;
  block4ClassName?: string;
  block4AssignmentLastUpdated?: string;
  block5Assignment?: string;
  block5ClassName?: string;
  block5AssignmentLastUpdated?: string;
  sortingHat?: string;
  parent?: string[];
  [key: string]: any;
}

const TransferData: React.FC = () => {
  // check if in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return null;
  }

  return (
    <div>
      <h1>TransferData</h1>
      <GradientButton onClick={doDataTransfer} disabled>
        transfer
      </GradientButton>
    </div>
  );
};

const doDataTransfer = async (): Promise<void> => {
  console.log('transferring data');
  const dataFetched = await getData();
  console.log('dataFetched', dataFetched);
  //get first 5 itmes
  const dataToUse = dataFetched;
  console.log('data', dataToUse);
  for (const item of dataToUse) {
    await doItem(item);
  }
};

const doItem = async (item: DisciplineItem): Promise<void> => {
  console.log('item', item);
  if (!item.date) item.date = undefined;
  if (!item.teacherComments) item.teacherComments = '';
  if (!item.adminComments) item.adminComments = '';
  if (!item.classType) item.classType = '';
  if (!item.location) item.location = '';
  if (!item.timeOfDay) item.timeOfDay = '';
  if (!item.addressed) item.addressed = undefined;
  if (!item.inappropriateLanguage) item.inappropriateLanguage = false;
  if (!item.physicalConduct) item.physicalConduct = false;
  if (!item.nonCompliance) item.nonCompliance = false;
  if (!item.disruption) item.disruption = false;
  if (!item.propertyMisuse) item.propertyMisuse = false;
  if (!item.otherConduct) item.otherConduct = false;
  if (!item.VerbalWarning) item.VerbalWarning = false;
  if (!item.buddyRoom) item.buddyRoom = false;
  if (!item.conferenceWithStudent) item.conferenceWithStudent = false;
  if (!item.ParentContact) item.ParentContact = false;
  if (!item.PlanningRoomReferral) item.PlanningRoomReferral = false;
  if (!item.FollowupPlan) item.FollowupPlan = false;
  if (!item.LossOfPrivilege) item.LossOfPrivilege = false;
  if (!item.DetentionWithTeacher) item.DetentionWithTeacher = false;
  if (!item.IndividualizedInstruction) item.IndividualizedInstruction = false;
  if (!item.GuidanceReferral) item.GuidanceReferral = false;
  if (!item.ReferToAdministrator) item.ReferToAdministrator = false;
  if (!item.OtherAction) item.OtherAction = false;
  if (!item.none) item.none = false;
  if (!item.peers) item.peers = false;
  if (!item.teacherInvolved) item.teacherInvolved = false;
  if (!item.substitute) item.substitute = false;
  if (!item.unknown) item.unknown = false;
  if (!item.othersInvolved) item.othersInvolved = false;

  const newItem = await sendDataToTransfer(item);
  console.log('newItem', newItem);
};

const getData = async (): Promise<DisciplineItem[]> => {
  const headers = {
    credentials: 'include' as const,
    mode: 'cors' as const,
    headers: {
      authorization: `test auth for keystone`,
    },
  };

  const graphQLClient = new GraphQLClient(inputEndPoint, headers);

  const fetchData = async () => graphQLClient.request(queryToFetch);

  console.log('fetching Data');
  const dataToReturn = await fetchData();
  // console.log(dataToReturn);
  return dataToReturn.allDisciplines;
};

const sendDataToTransfer = async (item: DisciplineItem): Promise<any> => {
  const headers = {
    credentials: 'include' as const,
    mode: 'cors' as const,
    headers: {
      authorization: `test auth for keystone`,
    },
  };

  const graphQLClient = new GraphQLClient(outPutEndPoint, headers);

  const sendUserMutation = async () =>
    graphQLClient.request(mutationToSend, item);
  const mutationData = await sendUserMutation();
  console.log('mutationData', mutationData);
  return mutationData;
};

const queryToFetch = gql`
  query {
    allDisciplines {
      student {
        email
      }
      teacher {
        email
      }
      date
      teacherComments
      adminComments
      classType
      location
      timeOfDay
      inappropriateLanguage
      physicalConduct
      nonCompliance
      disruption
      propertyMisuse
      otherConduct
      VerbalWarning
      buddyRoom
      conferenceWithStudent
      ParentContact
      PlanningRoomReferral
      FollowupPlan
      LossOfPrivilege
      DetentionWithTeacher
      IndividualizedInstruction
      GuidanceReferral
      ReferToAdministrator
      OtherAction
      none
      peers
      teacherInvolved
      substitute
      unknown
      othersInvolved
    }
  }
`;

const mutationToSend = gql`
  mutation (
    $student: UserWhereUniqueInput!
    $teacher: UserWhereUniqueInput!
    $teacherComments: String
    $adminComments: String
    $classType: String
    $location: String
    $timeOfDay: String
    $date: DateTime
    $addressed: DateTime
    $inappropriateLanguage: Boolean
    $physicalConduct: Boolean
    $nonCompliance: Boolean
    $disruption: Boolean
    $propertyMisuse: Boolean
    $otherConduct: Boolean
    $VerbalWarning: Boolean
    $buddyRoom: Boolean
    $conferenceWithStudent: Boolean
    $ParentContact: Boolean
    $PlanningRoomReferral: Boolean
    $FollowupPlan: Boolean
    $LossOfPrivilege: Boolean
    $DetentionWithTeacher: Boolean
    $IndividualizedInstruction: Boolean
    $GuidanceReferral: Boolean
    $ReferToAdministrator: Boolean
    $OtherAction: Boolean
    $none: Boolean
    $peers: Boolean
    $teacherInvolved: Boolean
    $substitute: Boolean
    $unknown: Boolean
    $othersInvolved: Boolean
  ) {
    createDiscipline(
      data: {
        student: { connect: $student }
        teacher: { connect: $teacher }
        teacherComments: $teacherComments
        adminComments: $adminComments
        classType: $classType
        location: $location
        timeOfDay: $timeOfDay
        date: $date
        addressed: $addressed
        inappropriateLanguage: $inappropriateLanguage
        physicalConduct: $physicalConduct
        nonCompliance: $nonCompliance
        disruption: $disruption
        propertyMisuse: $propertyMisuse
        otherConduct: $otherConduct
        VerbalWarning: $VerbalWarning
        buddyRoom: $buddyRoom
        conferenceWithStudent: $conferenceWithStudent
        ParentContact: $ParentContact
        PlanningRoomReferral: $PlanningRoomReferral
        FollowupPlan: $FollowupPlan
        LossOfPrivilege: $LossOfPrivilege
        DetentionWithTeacher: $DetentionWithTeacher
        IndividualizedInstruction: $IndividualizedInstruction
        GuidanceReferral: $GuidanceReferral
        ReferToAdministrator: $ReferToAdministrator
        OtherAction: $OtherAction
        none: $none
        peers: $peers
        teacherInvolved: $teacherInvolved
        substitute: $substitute
        unknown: $unknown
        othersInvolved: $othersInvolved
      }
    ) {
      id
    }
  }
`;

// query each user and do all of the connections to the other users
// to run this one put doUserConnectsions in the click event of the button
// assuemes users already got the users and put them in a file called users.js
const doUserConnections = async (): Promise<void> => {
  console.log('doUserConnections');
  // import user data from users.json
  // users.forEach(async (user) => {
  // console.log("user", user);
  // const updateduser = await sendUserUpdate(user);
  // console.log("updateduser", updateduser?.name);
  // })
  // const updateUser = await sendUserUpdate(users[100]);
  // console.log("updateUser", updateUser?.name);
};

const sendUserUpdate = async (user: User): Promise<any> => {
  // console.log("sendUserUpdate");
  // console.log(user);

  const userToSend = {
    email: user.email,
    connection: user.parent,
  };

  const headers = {
    credentials: 'include' as const,
    mode: 'cors' as const,
    headers: {
      authorization: `test auth for keystone`,
    },
  };

  const graphQLClient = new GraphQLClient(outPutEndPoint, headers);

  const sendUserMutation = async () =>
    graphQLClient.request(connectUserMutation, userToSend);

  // console.log("creating user");
  // console.log(userToSend)
  if (userToSend.connection && userToSend.connection[0]) {
    const userData = await sendUserMutation();
    console.log(userData);
    return userData;
  }
};

const connectUserMutation = gql`
  mutation ($email: String!, $connection: [UserWhereUniqueInput!]) {
    updateUser(
      where: { email: $email }
      data: { parent: { connect: $connection } }
    ) {
      id
      name
      email
    }
  }
`;

//   Below is get all users and add to database
// to use this put doTransfer in the click event
const allUserQuery = gql`
  query {
    allUsers {
      id
      name
      email
      preferredName
      canManageCalendar
      canManageUsers
      canSeeOtherUsers
      canManageLinks
      canManageDiscipline
      canSeeAllDiscipline
      canSeeAllTeacherEvents
      canSeeStudentEvents
      canSeeOwnCallback
      canSeeAllCallback
      hasTA
      hasClasses
      isStudent
      isParent
      isStaff
      isTeacher
      isGuidance
      isSuperAdmin
      canManagePbis
      callbackCount
      totalCallbackCount
      PbisCardCount
      YearPbisCount
      teacherSubject
      taPbisCardCount
      averageTimeToCompleteCallback
      block1Assignment
      block1ClassName
      block1AssignmentLastUpdated
      block2Assignment
      block2ClassName
      block2AssignmentLastUpdated
      block3Assignment
      block3ClassName
      block3AssignmentLastUpdated
      block4Assignment
      block4ClassName
      block4AssignmentLastUpdated
      block5Assignment
      block5ClassName
      block5AssignmentLastUpdated
      sortingHat
      taTeacher {
        email
      }
      parent {
        email
      }
      children {
        email
      }
      block1Teacher {
        email
      }
      block1Students {
        email
      }
      block2Teacher {
        email
      }
      block2Students {
        email
      }
      block3Teacher {
        email
      }
      block3Students {
        email
      }
      block4Teacher {
        email
      }
      block4Students {
        email
      }
      block5Teacher {
        email
      }
      block5Students {
        email
      }
      currentTaWinner {
        email
      }
      previousTaWinner {
        email
      }
    }
  }
`;

const createUserMutation = gql`
  mutation (
    $name: String!
    $email: String!
    $password: String!
    $preferredName: String!
    $canManageCalendar: Boolean!
    $canManageUsers: Boolean!
    $canSeeOtherUsers: Boolean!
    $canManageLinks: Boolean!
    $canManageDiscipline: Boolean!
    $canSeeAllDiscipline: Boolean!
    $canSeeAllTeacherEvents: Boolean!
    $canSeeStudentEvents: Boolean!
    $canSeeOwnCallback: Boolean!
    $canSeeAllCallback: Boolean!
    $hasTA: Boolean!
    $hasClasses: Boolean!
    $isStudent: Boolean!
    $isParent: Boolean!
    $isStaff: Boolean!
    $isTeacher: Boolean!
    $isGuidance: Boolean!
    $isSuperAdmin: Boolean!
    $canManagePbis: Boolean!
    $callbackCount: Int!
    $totalCallbackCount: Int!
    $PbisCardCount: Int!
    $YearPbisCount: Int!
    $teacherSubject: String!
    $taPbisCardCount: Int!
    $averageTimeToCompleteCallback: Int!
    $block1Assignment: String!
    $block1ClassName: String!
    $block1AssignmentLastUpdated: String!
    $block2Assignment: String!
    $block2ClassName: String!
    $block2AssignmentLastUpdated: String!
    $block3Assignment: String!
    $block3ClassName: String!
    $block3AssignmentLastUpdated: String!
    $block4Assignment: String!
    $block4ClassName: String!
    $block4AssignmentLastUpdated: String!
    $block5Assignment: String!
    $block5ClassName: String!
    $block5AssignmentLastUpdated: String!
    $sortingHat: String!
  ) {
    createUser(
      name: $name
      email: $email
      password: $password
      preferredName: $preferredName
      canManageCalendar: $canManageCalendar
      canManageUsers: $canManageUsers
      canSeeOtherUsers: $canSeeOtherUsers
      canManageLinks: $canManageLinks
      canManageDiscipline: $canManageDiscipline
      canSeeAllDiscipline: $canSeeAllDiscipline
      canSeeAllTeacherEvents: $canSeeAllTeacherEvents
      canSeeStudentEvents: $canSeeStudentEvents
      canSeeOwnCallback: $canSeeOwnCallback
      canSeeAllCallback: $canSeeAllCallback
      hasTA: $hasTA
      hasClasses: $hasClasses
      isStudent: $isStudent
      isParent: $isParent
      isStaff: $isStaff
      isTeacher: $isTeacher
      isGuidance: $isGuidance
      isSuperAdmin: $isSuperAdmin
      canManagePbis: $canManagePbis
      callbackCount: $callbackCount
      totalCallbackCount: $totalCallbackCount
      PbisCardCount: $PbisCardCount
      YearPbisCount: $YearPbisCount
      teacherSubject: $teacherSubject
      taPbisCardCount: $taPbisCardCount
      averageTimeToCompleteCallback: $averageTimeToCompleteCallback
      block1Assignment: $block1Assignment
      block1ClassName: $block1ClassName
      block1AssignmentLastUpdated: $block1AssignmentLastUpdated
      block2Assignment: $block2Assignment
      block2ClassName: $block2ClassName
      block2AssignmentLastUpdated: $block2AssignmentLastUpdated
      block3Assignment: $block3Assignment
      block3ClassName: $block3ClassName
      block3AssignmentLastUpdated: $block3AssignmentLastUpdated
      block4Assignment: $block4Assignment
      block4ClassName: $block4ClassName
      block4AssignmentLastUpdated: $block4AssignmentLastUpdated
      block5Assignment: $block5Assignment
      block5ClassName: $block5ClassName
      block5AssignmentLastUpdated: $block5AssignmentLastUpdated
      sortingHat: $sortingHat
    ) {
      id
      name
      email
    }
  }
`;

const simpleMutation = gql`
  mutation (
    $name: String!
    $email: String!
    $password: String!
    $preferredName: String!
    $canManageCalendar: Boolean!
    $canManageUsers: Boolean!
    $canSeeOtherUsers: Boolean!
    $canManageLinks: Boolean!
    $canManageDiscipline: Boolean!
    $canSeeAllDiscipline: Boolean!
    $canSeeAllTeacherEvents: Boolean!
    $canSeeStudentEvents: Boolean!
    $canSeeOwnCallback: Boolean!
    $canSeeAllCallback: Boolean!
    $hasTA: Boolean!
    $hasClasses: Boolean!
    $isStudent: Boolean!
    $isParent: Boolean!
    $isStaff: Boolean!
    $isTeacher: Boolean!
    $isGuidance: Boolean!
    $isSuperAdmin: Boolean!
    $canManagePbis: Boolean!
    $callbackCount: Int!
    $totalCallbackCount: Int!
    $PbisCardCount: Int!
    $YearPbisCount: Int!
    $teacherSubject: String!
    $taPbisCardCount: Int!
    $averageTimeToCompleteCallback: Int!
    $block1Assignment: String!
    $block1ClassName: String!
    $block1AssignmentLastUpdated: DateTime
    $block2Assignment: String!
    $block2ClassName: String!
    $block2AssignmentLastUpdated: DateTime
    $block3Assignment: String!
    $block3ClassName: String!
    $block3AssignmentLastUpdated: DateTime
    $block4Assignment: String!
    $block4ClassName: String!
    $block4AssignmentLastUpdated: DateTime
    $block5Assignment: String!
    $block5ClassName: String!
    $block5AssignmentLastUpdated: DateTime
    $sortingHat: String!
  ) {
    createUser(
      data: {
        name: $name
        email: $email
        password: $password
        preferredName: $preferredName
        canManageCalendar: $canManageCalendar
        canManageUsers: $canManageUsers
        canSeeOtherUsers: $canSeeOtherUsers
        canManageLinks: $canManageLinks
        canManageDiscipline: $canManageDiscipline
        canSeeAllDiscipline: $canSeeAllDiscipline
        canSeeAllTeacherEvents: $canSeeAllTeacherEvents
        canSeeStudentEvents: $canSeeStudentEvents
        canSeeOwnCallback: $canSeeOwnCallback
        canSeeAllCallback: $canSeeAllCallback
        hasTA: $hasTA
        hasClasses: $hasClasses
        isStudent: $isStudent
        isParent: $isParent
        isStaff: $isStaff
        isTeacher: $isTeacher
        isGuidance: $isGuidance
        isSuperAdmin: $isSuperAdmin
        canManagePbis: $canManagePbis
        callbackCount: $callbackCount
        totalCallbackCount: $totalCallbackCount
        PbisCardCount: $PbisCardCount
        YearPbisCount: $YearPbisCount
        teacherSubject: $teacherSubject
        taPbisCardCount: $taPbisCardCount
        averageTimeToCompleteCallback: $averageTimeToCompleteCallback
        block1Assignment: $block1Assignment
        block1ClassName: $block1ClassName
        block1AssignmentLastUpdated: $block1AssignmentLastUpdated
        block2Assignment: $block2Assignment
        block2ClassName: $block2ClassName
        block2AssignmentLastUpdated: $block2AssignmentLastUpdated
        block3Assignment: $block3Assignment
        block3ClassName: $block3ClassName
        block3AssignmentLastUpdated: $block3AssignmentLastUpdated
        block4Assignment: $block4Assignment
        block4ClassName: $block4ClassName
        block4AssignmentLastUpdated: $block4AssignmentLastUpdated
        block5Assignment: $block5Assignment
        block5ClassName: $block5ClassName
        block5AssignmentLastUpdated: $block5AssignmentLastUpdated
        sortingHat: $sortingHat
      }
    ) {
      name
      email
      id
    }
  }
`;

const sendData = async (user: User): Promise<void> => {
  const userToSend = {
    name: user.name || '',
    email: user.email || '',
    password: user.password || 'password',
    preferredName: user.preferredName || '',
    canManageCalendar: user.canManageCalendar || false,
    canManageUsers: user.canManageUsers || false,
    canSeeOtherUsers: user.canSeeOtherUsers || false,
    canManageLinks: user.canManageLinks || false,
    canManageDiscipline: user.canManageDiscipline || false,
    canSeeAllDiscipline: user.canSeeAllDiscipline || false,
    canSeeAllTeacherEvents: user.canSeeAllTeacherEvents || false,
    canSeeStudentEvents: user.canSeeStudentEvents || false,
    canSeeOwnCallback: user.canSeeOwnCallback || false,
    canSeeAllCallback: user.canSeeAllCallback || false,
    hasTA: user.hasTA || false,
    hasClasses: user.hasClasses || false,
    isStudent: user.isStudent || false,
    isParent: user.isParent || false,
    isStaff: user.isStaff || false,
    isTeacher: user.isTeacher || false,
    isGuidance: user.isGuidance || false,
    isSuperAdmin: user.isSuperAdmin || false,
    canManagePbis: user.canManagePbis || false,
    callbackCount: user.callbackCount || 0,
    totalCallbackCount: user.totalCallbackCount || 0,
    PbisCardCount: user.PbisCardCount || 0,
    YearPbisCount: user.YearPbisCount || 0,
    teacherSubject: user.teacherSubject || '',
    taPbisCardCount: user.taPbisCardCount || 0,
    averageTimeToCompleteCallback: user.averageTimeToCompleteCallback || 0,
    block1Assignment: user.block1Assignment || '',
    block1ClassName: user.block1ClassName || '',
    block1AssignmentLastUpdated: new Date(
      user.block1AssignmentLastUpdated || '',
    ),
    block2Assignment: user.block2Assignment || '',
    block2ClassName: user.block2ClassName || '',
    block2AssignmentLastUpdated: new Date(
      user.block2AssignmentLastUpdated || '',
    ),
    block3Assignment: user.block3Assignment || '',
    block3ClassName: user.block3ClassName || '',
    block3AssignmentLastUpdated: new Date(
      user.block3AssignmentLastUpdated || '',
    ),
    block4Assignment: user.block4Assignment || '',
    block4ClassName: user.block4ClassName || '',
    block4AssignmentLastUpdated: new Date(
      user.block4AssignmentLastUpdated || '',
    ),
    block5Assignment: user.block5Assignment || '',
    block5ClassName: user.block5ClassName || '',
    block5AssignmentLastUpdated: new Date(
      user.block5AssignmentLastUpdated || '',
    ),
    sortingHat: user.sortingHat || '',
  };
  // console.log("user to send", user);
  const headers = {
    credentials: 'include' as const,
    mode: 'cors' as const,
    headers: {
      authorization: `test auth for keystone`,
    },
  };

  const graphQLClient = new GraphQLClient(outPutEndPoint, headers);

  const sendUserMutation = async () =>
    graphQLClient.request(simpleMutation, userToSend);

  console.log('creating user');
  console.log(userToSend);
  const userData = await sendUserMutation();
  console.log(userData);
};

const doTransfer = async (): Promise<void> => {
  console.log('doTransfer');
  // This function needs to be updated to use the correct query
  // For now, we'll comment it out as it's not being used
  // const dataToUser = await getData();
  // console.log('data', dataToUser);
  // const userList = dataToUser.allUsers;
  // // loop over each user and then create them
  // for (let i = 0; i < userList.length; i++) {
  //   const user = userList[i];
  //   await sendData(user);
  //   console.log('user', user);
  // }
};

export default TransferData;
