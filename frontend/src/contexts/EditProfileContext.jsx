import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * EditProfileContext
 *
 * Shared between ProfileSettingsLayout (shell) and individual
 * settings pages (BasicInformationSettings, AcademicSettings).
 *
 * The layout shell reads { saving, isChanged } to control the sticky
 * "Save Changes" button, and calls triggerSave() when the button is pressed.
 *
 * Individual pages register their save handler via registerSaveHandler().
 */

const EditProfileContext = createContext(null);

export const EditProfileProvider = ({ children }) => {
    const [saving, setSaving] = useState(false);
    const [isChanged, setIsChanged] = useState(false);
    const [saveHandlerRef, setSaveHandlerRef] = useState({ fn: null });

    const registerSaveHandler = useCallback((fn) => {
        setSaveHandlerRef({ fn });
    }, []);

    const triggerSave = useCallback(async () => {
        if (saveHandlerRef.fn) {
            await saveHandlerRef.fn();
        }
    }, [saveHandlerRef]);

    return (
        <EditProfileContext.Provider value={{
            saving,
            setSaving,
            isChanged,
            setIsChanged,
            registerSaveHandler,
            triggerSave,
        }}>
            {children}
        </EditProfileContext.Provider>
    );
};

export const useEditProfile = () => {
    const ctx = useContext(EditProfileContext);
    if (!ctx) throw new Error('useEditProfile must be used inside EditProfileProvider');
    return ctx;
};

export default EditProfileContext;
