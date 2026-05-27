export default function ProfileMenuSection({ label, children }) {
  return (
    <div className="profile-menu-section">
      {label && <p className="profile-menu-section__label">{label}</p>}
      <div className="profile-menu-section__items">
        {children}
      </div>
    </div>
  );
}