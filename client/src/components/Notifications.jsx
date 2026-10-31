import { App, Button, Modal } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  DeleteAllNotifications,
  MarkNotificationAsRead,
} from "../apicalls/notifications";
import { SetNotifications } from "../redux/usersSlice";

dayjs.extend(relativeTime);

function Notifications({ showNotifications, setShowNotifications }) {
  const { notifications } = useSelector((state) => state.users);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const hasUnread = notifications.some((item) => !item.read);

  useEffect(() => {
    if (!hasUnread) return;
    MarkNotificationAsRead().then((response) => {
      if (response.success) {
        dispatch(SetNotifications(response.data));
      }
    });
  }, [hasUnread]);

  const deleteAllNotifications = async () => {
    const response = await DeleteAllNotifications();
    if (response.success) {
      dispatch(SetNotifications([]));
    } else {
      message.error(response.message);
    }
  };

  return (
    <Modal
      title="Notifications"
      open={showNotifications}
      onCancel={() => setShowNotifications(false)}
      centered
      footer={null}
      width={640}
    >
      <div className="flex flex-col gap-3 mt-4 max-h-[60vh] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="flex justify-end">
            <Button type="link" danger onClick={deleteAllNotifications}>
              Delete All
            </Button>
          </div>
        ) : (
          <p className="text-center text-muted py-6">You're all caught up</p>
        )}
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className="flex justify-between gap-4 border border-solid border-line p-3 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-raised"
            onClick={() => {
              setShowNotifications(false);
              navigate(notification.onClick);
            }}
          >
            <div className="flex flex-col">
              <span className="font-semibold">
                {notification.title}
              </span>
              <span className="text-sm text-muted">
                {notification.description}
              </span>
            </div>
            <span className="text-xs text-muted whitespace-nowrap">
              {dayjs(notification.createdAt).fromNow()}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default Notifications;
