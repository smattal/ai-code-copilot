import React from 'react';
import { t } from 'i18next';

type Props = { userId: string; avatarUrl: string; fullName: string; bio?: string };

const User_Profile_Widget_0002: React.FC<Props> = ({ userId, avatarUrl, fullName, bio }) => {
  return (
    <div id={`user-card-${userId}`} className="card token-border token-padding">
      <img src={avatarUrl} alt={`Avatar of ${fullName}`} id={`avatar-${userId}`} />
      <h2>{fullName}</h2>
      <p>{bio}</p>
      <a href={`/users/${userId}`} target="_blank">{t('user.viewProfile')}</a>
      <button onClick={() => console.log('clicked')}{t('user.follow')}</button>
    </div>
  );
};

export default User_Profile_Widget_0002;
