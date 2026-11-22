import './AuthenticatedLayout.css'

const navigationItems = [
  { name: 'Home', icon: '⌂' },
  { name: 'Explore', icon: '⌕' },
  { name: 'Create', icon: '+' },
  { name: 'Messages', icon: '✉' },
  { name: 'Notifications', icon: '♧' },
  { name: 'Translator', icon: '✋' },
  { name: 'Profile', icon: '◉' },
]

function AuthenticatedLayout({
  isAuthenticated,
  activePage = 'Home',
  onNavigate,
  userProfile,
  onLogout,
  children,
}) {
  // Keep the public website visible until the user logs in.
  if (!isAuthenticated) {
    return children
  }

  const username = userProfile?.username || 'Community Member'
  const displayName = userProfile?.first_name || username

  const initials = displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-symbol">S</div>
          <div>
            <h2>SignConnect</h2>
            <span>Connect beyond words</span>
          </div>
        </div>

        <div className="sidebar-section-label">MENU</div>

        <nav className="sidebar-navigation" aria-label="Dashboard navigation">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`sidebar-nav-item ${activePage === item.name ? 'active' : ''}`}
              onClick={() => onNavigate?.(item.name)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="accessibility-card">
            <span className="accessibility-icon">✦</span>
            <h3>Communication for everyone</h3>
            <p>A space where every voice and every gesture matters.</p>
          </div>

          <button type="button" className="sidebar-logout" onClick={onLogout}>
            <span>↪</span>
            Log out
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-mobile-brand">
            <div className="brand-symbol">S</div>
            <h2>SignConnect</h2>
          </div>

          <div className="topbar-welcome">
            <span>YOUR COMMUNITY SPACE</span>
            <h2>Welcome, {displayName}</h2>
          </div>

          <button
            type="button"
            className="topbar-profile"
            onClick={() => onNavigate?.('Profile')}
            aria-label="Open profile"
          >
            <div className="profile-avatar">
              {userProfile?.profile_picture ? (
                <img src={userProfile.profile_picture} alt="Profile" />
              ) : (
                initials || 'SC'
              )}
            </div>
            <div className="topbar-user-info">
              <strong>{displayName}</strong>
              <span>@{username}</span>
            </div>
          </button>
        </header>

        <main className="app-content">{children}</main>
      </div>

      <nav className="mobile-navigation" aria-label="Mobile dashboard navigation">
        {navigationItems.map((item) => (
          <button
            key={item.name}
            type="button"
            className={activePage === item.name ? 'active' : ''}
            onClick={() => onNavigate?.(item.name)}
            aria-label={item.name}
            title={item.name}
          >
            <span>{item.icon}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default AuthenticatedLayout
