import React from 'react';
import UserMenu from '../common/UserMenu';

const ProfileDropdown = (props) => {
    return <UserMenu direction="down" align="right" {...props} />;
};

export default ProfileDropdown;
