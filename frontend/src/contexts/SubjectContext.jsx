import { createContext, useContext } from 'react';

/**
 * SubjectContext
 *
 * Populated by DashboardLayout when on a subject route.
 * Consumed by SubjectContentPage and SubjectDropdownMenu to access
 * the subject list without a duplicate API call.
 */
const SubjectContext = createContext({
    subjects: [],
    filteredSubjects: [],
    subjectSearch: '',
    setSubjectSearch: () => {},
    onSelectSubject: () => {},
    loadingSubjects: false,
    activeSubjectId: null,
    pinnedIds: [],
    onTogglePin: () => {},
    isSubjectsModalOpen: false,
    setIsSubjectsModalOpen: () => {},
});

export const useSubjectContext = () => useContext(SubjectContext);

export default SubjectContext;
