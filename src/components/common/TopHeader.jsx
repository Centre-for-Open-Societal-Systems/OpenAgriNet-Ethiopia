import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, 
    Bell, 
    Globe, 
    Moon, 
    Sun, 
    Languages, 
    Sprout, 
    Building2, 
    Shield, 
    LayoutDashboard, 
    User, 
    Settings, 
    LogOut,
    Server,
    Activity,
    CloudRain,
    TrendingUp,
    CheckCircle2
} from 'lucide-react';
import ATILogo from '../ATILogo';
import './TopHeader.css';

const TopHeader = ({ 
    userRole, 
    onRoleChange, 
    theme, 
    toggleTheme, 
    language, 
    setLanguage, 
    onLogout 
}) => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showRoleMenu, setShowRoleMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New farmer registration', text: ['Abebe Kebede registered in Addis Ababa', 'Abebe Kebede is a resident of Addis Ababa'], time: '2 hours ago', isRead: false, type: 'farmer' },
        { id: 2, title: 'Data import complete', text: ['500 records imported successfully'], time: '5 hours ago', isRead: false, type: 'system' },
        { id: 3, title: 'System update', text: ['New features available in Reports module'], time: '1 day ago', isRead: false, type: 'system' },
        { id: 4, title: 'Livestock Alert', text: ['Unusual movement detected in Sector 4'], time: '3 hours ago', isRead: false, type: 'livestock' },
        { id: 5, title: 'Crop Production Plot', text: ['New plot added by Tadesse Mesfin'], time: '1 hour ago', isRead: false, type: 'crop' },
        { id: 6, title: 'Pending Verification', text: ['Request from Bank of Abyssinia'], time: '4 hours ago', isRead: false, type: 'bank' },
        { id: 7, title: 'Weather Warning', text: ['Heavy rainfall expected in Oromia region'], time: '6 hours ago', isRead: false, type: 'weather' },
        { id: 8, title: 'New farmer registration', text: ['Mulugeta Bekele registered in Amhara'], time: '7 hours ago', isRead: false, type: 'farmer' },
        { id: 9, title: 'Market Price Update', text: ['Wheat prices rose by 5% today'], time: '8 hours ago', isRead: false, type: 'market' },
        { id: 10, title: 'System Maintenance', text: ['Scheduled for 11:00 PM tonight'], time: '10 hours ago', isRead: false, type: 'update' },
        { id: 11, title: 'Soil Report Ready', text: ['ID: SR-2042 for Plot 12'], time: '12 hours ago', isRead: false, type: 'crop' },
        { id: 12, title: 'Bank User Access', text: ['New account created for Dashen Bank'], time: '14 hours ago', isRead: false, type: 'bank' },
        { id: 13, title: 'Livestock Records', text: ['Vaccination cycle complete for Batch A'], time: '16 hours ago', isRead: false, type: 'livestock' },
        { id: 14, title: 'Security Alert', text: ['Multiple failed login attempts detected'], time: '18 hours ago', isRead: false, type: 'update' },
        { id: 15, title: 'New farmer registration', text: ['Aster Kassa registered in Sidama'], time: '20 hours ago', isRead: false, type: 'farmer' },
        { id: 16, title: 'Data Backup', text: ['Daily snapshot completed successfully'], time: '22 hours ago', isRead: false, type: 'system' },
        { id: 17, title: 'Grant Opportunity', text: ['New funding available for smallholders'], time: '1 day ago', isRead: false, type: 'bank' },
        { id: 18, title: 'Seed Distribution', text: ['Batch 402 dispatched to warehouses'], time: '1 day ago', isRead: false, type: 'crop' }
    ]);

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'farmer': return <User size={18} />;
            case 'system': return <Server size={18} />;
            case 'update': return <Shield size={18} />;
            case 'livestock': return <Activity size={18} />;
            case 'crop': return <Sprout size={18} />;
            case 'bank': return <Building2 size={18} />;
            case 'weather': return <CloudRain size={18} />;
            case 'market': return <TrendingUp size={18} />;
            default: return <Bell size={18} />;
        }
    };

    const getNotificationColor = (type) => {
        switch(type) {
            case 'farmer': return 'blue';
            case 'system': return 'green';
            case 'update': return 'orange';
            case 'livestock': return 'red';
            case 'crop': return 'green';
            case 'bank': return 'purple';
            case 'weather': return 'cyan';
            case 'market': return 'yellow';
            default: return 'gray';
        }
    };

    const roleSwitcherRef = useRef(null);
    const userProfileRef = useRef(null);
    const notificationRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target)) {
                setShowRoleMenu(false);
            }
            if (userProfileRef.current && !userProfileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getProfileData = () => {
        switch(userRole) {
            case 'Admin':
                return { name: 'System Admin', role: 'Administrator', icon: true };
            case 'Bank User':
                return { name: 'Financial Officer', role: 'Bank User', icon: true };
            case 'Super User':
                return { name: 'Head of Tech', role: 'Super User', icon: true };
            case 'Farmer':
            default:
                return { name: 'Abera Tadesse', role: 'ID: OAN-FR-1042', img: '/farmer_profile.png' };
        }
    };
    
    const profile = getProfileData();

    return (
        <header className="main-header">
            <div className="header-left">
                <ATILogo />
            </div>
            <div className="header-right">
                {/* Role Switcher */}
                <div className="role-switcher-container" ref={roleSwitcherRef}>
                    <button
                        className={`role-switcher-btn ${showRoleMenu ? 'active' : ''}`}
                        onClick={() => setShowRoleMenu(!showRoleMenu)}
                    >
                        <div className="role-icon-small">
                            {userRole === 'Farmer' ? <Sprout size={14} /> :
                                userRole === 'Bank User' ? <Building2 size={14} /> :
                                    userRole === 'Admin' ? <Shield size={14} /> :
                                        <LayoutDashboard size={14} />}
                        </div>
                        <div className="role-text-container">
                            <div className="role-label">Switch Role</div>
                            <div className="role-value">{userRole === 'Admin' ? 'Admin User' : userRole}</div>
                        </div>
                        <ChevronDown size={14} className={`role-chevron ${showRoleMenu ? 'rotated' : ''}`} />
                    </button>

                    {showRoleMenu && (
                        <div className="role-dropdown">
                            {[
                                { id: 'Farmer', label: 'Farmer', icon: <Sprout size={16} /> },
                                { id: 'Bank User', label: 'Bank User', icon: <Building2 size={16} /> },
                                { id: 'Admin', label: 'Admin User', icon: <Shield size={16} /> },
                                { id: 'Super User', label: 'Super User', icon: <LayoutDashboard size={16} /> }
                            ].map(role => (
                                <div
                                    key={role.id}
                                    className={`role-option ${userRole === role.id ? 'active' : ''}`}
                                    onClick={() => { onRoleChange(role.id); setShowRoleMenu(false); }}
                                >
                                    <div className="role-opt-icon">{role.icon}</div>
                                    <span>{role.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Language Pill */}
                <div className="language-selector-pill">
                    <div
                        className={`lang-option en ${language === 'en' ? 'active' : ''}`}
                        onClick={() => setLanguage('en')}
                    >
                        <Globe size={14} />
                        <span className="lang-text-bold">EN</span>
                    </div>
                    <div
                        className={`lang-option am ${language === 'am' ? 'active' : ''}`}
                        onClick={() => setLanguage('am')}
                    >
                        <Languages size={14} />
                        <span>አማ</span>
                    </div>
                </div>

                {/* Theme Toggle */}
                <button className="theme-toggle-btn" onClick={toggleTheme}>
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                {/* Notifications */}
                <div className="header-action notification" ref={notificationRef}>
                    <div className="notification-icon-wrapper" onClick={() => setShowNotifications(!showNotifications)}>
                        <Bell size={22} />
                        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                    </div>
                    
                    {showNotifications && (
                        <div className="notifications-dropdown">
                            <div className="notifications-header">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button className="mark-all-read-btn" onClick={markAllAsRead}>
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="notifications-list">
                                {notifications.length > 0 ? (
                                    notifications.map(notification => (
                                        <div 
                                            key={notification.id} 
                                            className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className={`notification-avatar-left ${getNotificationColor(notification.type)}`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="notification-item-content">
                                                <div className="notification-item-title">{notification.title}</div>
                                                {notification.text.map((line, i) => (
                                                    <div key={i} className="notification-item-text">{line}</div>
                                                ))}
                                                <div className="notification-item-time">{notification.time}</div>
                                            </div>
                                            {!notification.isRead ? (
                                                <div className="unread-dot"></div>
                                            ) : (
                                                <CheckCircle2 size={16} className="read-check-icon" />
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-notifications">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div
                    className={`user-profile ${showProfileMenu ? 'active' : ''}`}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    ref={userProfileRef}
                >
                    {profile.img ? (
                        <div className="avatar profile-avatar">
                            <img src={profile.img} alt={profile.name} className="avatar-img" />
                        </div>
                    ) : (
                        <div className="avatar">
                            <User size={20} color="white" />
                        </div>
                    )}
                    <div className="user-info">
                        <span className="user-name">{profile.name}</span>
                        <span className="user-role">{profile.role}</span>
                    </div>
                    <ChevronDown size={14} className={`user-profile-chevron ${showProfileMenu ? 'rotated' : ''}`} />

                    {showProfileMenu && (
                        <div className="profile-dropdown">
                            <div className="dropdown-item">
                                <User size={16} />
                                <span>{userRole === 'Super User' ? 'Account Info' : 'Profile'}</span>
                            </div>
                            <div className="dropdown-item">
                                <Settings size={16} />
                                <span>{userRole === 'Super User' ? 'System Maintenance' : 'Settings'}</span>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item text-red" onClick={onLogout}>
                                <LogOut size={16} />
                                <span>{userRole === 'Super User' ? 'System Logout' : 'Logout'}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopHeader;
