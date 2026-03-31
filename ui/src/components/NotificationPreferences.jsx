import { useState, useEffect } from 'react'
import OneSignal from 'react-onesignal'

/**
 * Bell button + dropdown that lets users subscribe to push notifications
 * for all teams or a specific team. Uses OneSignal tags to target delivery.
 *
 * Tag set on subscriber: { team_id: 'all' | '<team-id>' }
 */
export default function NotificationPreferences({ teams }) {
  const [open, setOpen] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [currentTag, setCurrentTag] = useState(null) // 'all' | team.id | null

  // Check current subscription state on mount
  useEffect(() => {
    if (!import.meta.env.VITE_ONESIGNAL_APP_ID) return
    OneSignal.User.PushSubscription.optedIn && setSubscribed(OneSignal.User.PushSubscription.optedIn)
    OneSignal.User.getTags().then((tags) => {
      if (tags?.team_id) setCurrentTag(tags.team_id)
    }).catch(() => {})
  }, [])

  async function subscribe(teamId) {
    try {
      // Request permission and subscribe if not already
      if (!OneSignal.User.PushSubscription.optedIn) {
        await OneSignal.Slidedown.promptPush()
      }
      // Tag this device with the chosen team
      await OneSignal.User.addTag('team_id', teamId)
      setCurrentTag(teamId)
      setSubscribed(true)
    } catch {
      // User dismissed the prompt — do nothing
    }
    setOpen(false)
  }

  async function unsubscribe() {
    try {
      await OneSignal.User.removeTag('team_id')
      await OneSignal.User.PushSubscription.optOut()
      setCurrentTag(null)
      setSubscribed(false)
    } catch {}
    setOpen(false)
  }

  if (!import.meta.env.VITE_ONESIGNAL_APP_ID) return null

  const label = subscribed && currentTag
    ? currentTag === 'all'
      ? '🔔 All Teams'
      : `🔔 ${teams.find(t => t.id === currentTag)?.teamName ?? 'My Team'}`
    : '🔔 Notify Me'

  return (
    <div className="notif-wrap">
      <button className="notif-btn" onClick={() => setOpen(o => !o)}>
        {label}
      </button>

      {open && (
        <div className="notif-dropdown">
          <p className="notif-hint">Get notified when a home run is hit</p>

          <button
            className={`notif-option ${currentTag === 'all' ? 'active' : ''}`}
            onClick={() => subscribe('all')}
          >
            ⚾ All Teams
          </button>

          <div className="notif-divider">or pick one team</div>

          {teams.map(team => (
            <button
              key={team.id}
              className={`notif-option ${currentTag === team.id ? 'active' : ''}`}
              onClick={() => subscribe(team.id)}
            >
              {team.teamName}
              <span className="notif-owner">{team.owner}</span>
            </button>
          ))}

          {subscribed && (
            <button className="notif-unsub" onClick={unsubscribe}>
              Turn off notifications
            </button>
          )}
        </div>
      )}
    </div>
  )
}
