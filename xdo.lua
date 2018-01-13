local ffi = require("ffi")

local xdolib = ffi.load("xdo")
ffi.cdef[[

typedef struct Display {} Display;
typedef struct charcodemap_t {} charcodemap_t;
typedef struct XModifierKeymap {} XModifierKeymap;
typedef struct KeySym {} KeySym;
typedef struct Window {} Window;

typedef struct xdo {
  Display *xdpy;
  char *display_name;
  charcodemap_t *charcodes;
  int charcodes_len;
  XModifierKeymap *modmap;
  KeySym *keymap;
  int keycode_high;
  int keycode_low;
  int keysyms_per_keycode;
  int close_display_when_freed;
  int quiet;
  int debug;
  int features_mask;
} xdo_t;

xdo_t* xdo_new(char * display);
void xdo_free(xdo_t * xdo);
int xdo_move_mouse(const xdo_t *xdo, int x, int y, int screen);
int xdo_mouse_down(const xdo_t *xdo, unsigned long window, int button);
int xdo_mouse_up(const xdo_t *xdo, unsigned long window, int button);
int xdo_enter_text_window(const xdo_t *xdo, unsigned long window, const char *string, unsigned int delay);

int xdo_send_keysequence_window_up(const xdo_t *xdo, unsigned long window, const char *keysequence, unsigned int delay);
int xdo_send_keysequence_window_down(const xdo_t *xdo, unsigned long window, const char *keysequence, unsigned int delay);
]]

local current_window = 0

function xdo_new(display)
  local display = ":0"
  local c_str = ffi.new("char[?]", #display, display)
  local xdo = xdolib.xdo_new(c_str)
  return ffi.gc(xdo, xdolib.xdo_free)
end

local xdo = xdo_new(":0")

function move_mouse(xdo, x, y)
  xdolib.xdo_move_mouse(xdo, x, y, 0)
end

function mouse_down(xdo, button)
  xdolib.xdo_mouse_down(xdo, current_window, button)
end

function mouse_up(xdo, button)
  xdolib.xdo_mouse_up(xdo, current_window, button)
end

function key_down(xdo, keys)
  xdolib.xdo_send_keysequence_window_down(xdo, current_window, keys, 0);
end

function key_up(xdo, keys)
  xdolib.xdo_send_keysequence_window_up(xdo, current_window, keys, 0);
end

function enter_text(xdo, text)
  xdolib.xdo_enter_text_window(xdo, current_window, text, 0);
end

move_mouse(xdo, 100, 300, 0)
mouse_down(xdo, 1);
mouse_up(xdo, 1);

key_down(xdo, "a");
key_up(xdo, "a");

enter_text(xdo, "hello world")
