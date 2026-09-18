import React from 'react';
import UserMenu from './common/UserMenu';

const BottomProfileMenu = (props) => {
    return (
        <div className="relative z-50">
            <UserMenu direction="up" align="left" {...props} />
        </div>
    );
};

export default BottomProfileMenu;
