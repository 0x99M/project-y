import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const DBUS_INTERFACE = `
<node>
  <interface name="com.clipboard.manager.PasteHelper">
    <method name="Paste"/>
  </interface>
</node>`;

class PasteService {
  constructor() {
    const seat = Clutter.get_default_backend().get_default_seat();
    this._device = seat.create_virtual_device(
      Clutter.InputDeviceType.KEYBOARD_DEVICE
    );
  }

  _notify(key, state) {
    this._device.notify_keyval(
      Clutter.get_current_event_time() * 1000,
      key,
      state
    );
  }

  Paste() {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50, () => {
      this._notify(Clutter.KEY_Control_L, Clutter.KeyState.PRESSED);
      this._notify(Clutter.KEY_v, Clutter.KeyState.PRESSED);
      this._notify(Clutter.KEY_v, Clutter.KeyState.RELEASED);
      this._notify(Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
      return GLib.SOURCE_REMOVE;
    });
  }

  destroy() {
    this._device.run_dispose();
  }
}

export default class ClipboardPasteExtension {
  _service = null;
  _dbus = null;
  _ownerId = null;

  enable() {
    this._service = new PasteService();
    this._dbus = Gio.DBusExportedObject.wrapJSObject(
      DBUS_INTERFACE,
      this._service
    );
    this._dbus.export(
      Gio.DBus.session,
      '/com/clipboard/manager/PasteHelper'
    );
    this._ownerId = Gio.bus_own_name(
      Gio.BusType.SESSION,
      'com.clipboard.manager.PasteHelper',
      Gio.BusNameOwnerFlags.NONE,
      null, null, null
    );
  }

  disable() {
    if (this._dbus) {
      this._dbus.unexport();
      this._dbus = null;
    }
    if (this._ownerId) {
      Gio.bus_unown_name(this._ownerId);
      this._ownerId = null;
    }
    if (this._service) {
      this._service.destroy();
      this._service = null;
    }
  }
}
