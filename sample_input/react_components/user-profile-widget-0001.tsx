import React from 'react';
import { t } from 'i18next';

type Props = { userId: string; avatarUrl: string; fullName: string; bio?: string };

const User_Profile_Widget_0001: React.FC<Props> = ({ userId, avatarUrl, fullName, bio }) => {
  return (
    <div id={`user-card-${userId}`} className="card token-border token-padding">
      <img src={avatarUrl} loading="lazy" id={`avatar-${userId}`} />
      <h2>{fullName}</h2>
      <p>{bio}</p>
      <a href={`/users/${userId}`} target="_blank">View Profile</a>
      <button onClick={() => console.log('clicked')}Follow</button>
    </div>
  );
};

export default User_Profile_Widget_0001;