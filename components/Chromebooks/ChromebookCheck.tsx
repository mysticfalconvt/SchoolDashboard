// Shared chromebook-check GraphQL operations and message constants.
//
// Chromebook checks used to be weekly sweeps: every TA teacher checked every
// student, and this file also held a MultiStudentCheckForm for doing a whole TA
// group at once. Checks are now damage/incident reports created one at a time,
// so that bulk form and its helpers were removed. What remains is consumed by
// CreateSingleChromebookCheck and pages/taPage/[id].tsx.
import gql from 'graphql-tag';

export const CREATE_CHROMEBOOK_CHECK_MUTATION = gql`
  mutation CREATE_CHROMEBOOK_CHECK_MUTATION(
    $chromebookCheck: ChromebookCheckCreateInput!
  ) {
    createChromebookCheck(data: $chromebookCheck) {
      id
      message
      student {
        id
        name
      }
    }
  }
`;

export const GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY = gql`
  query GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY($id: ID) {
    user(where: { id: $id }) {
      id
      name
      taStudents {
        id
        name
        email
        parent {
          id
          name
          email
        }
        chromebookCheck(orderBy: { time: desc }, take: 1) {
          id
          message
          time
        }
      }
    }
  }
`;

// Four-state model: everything good, something wrong, out for service, or not in cart
export const ChromeBookCheckMessageOptions = [
  'Everything good',
  'Something wrong',
  'Out for Service',
  'Not in Cart',
];
export const goodCheckMessages = ['Everything good'];
export const noEmailNoPBISMessages = ['Out for Service', 'Not in Cart'];
// Note: chromebookEmails and formatParentName are now imported from chromebookEmailUtils
