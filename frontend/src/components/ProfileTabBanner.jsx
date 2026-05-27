export default function ProfileTabBanner({
  title,
  description,
  icon,
  gradient = "gradient-1",
}) {
  return (
    <div className={`profile-tab-banner profile-tab-banner--${gradient}`}>
      <div className="profile-tab-banner__content">
        <div className="profile-tab-banner__header">
          {icon && <img src={icon} alt="" className="profile-tab-banner__icon" />}
          <h2 className="profile-tab-banner__title">{title}</h2>
        </div>
        {description && (
          <p className="profile-tab-banner__description">{description}</p>
        )}
      </div>
      <div className="profile-tab-banner__decoration" />
    </div>
  );
}