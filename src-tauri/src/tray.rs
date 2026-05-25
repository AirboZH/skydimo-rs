use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

use once_cell::sync::Lazy;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, LogicalPosition, Manager, PhysicalPosition, PhysicalSize, WebviewWindow,
};

const TRAY_ICON_PNG: &[u8] = include_bytes!("../icons/tray.png");

static APP_START: Lazy<Instant> = Lazy::new(Instant::now);
static LAST_SHOWN_MS: AtomicU64 = AtomicU64::new(0);

fn mark_shown() {
    let ms = APP_START.elapsed().as_millis() as u64;
    LAST_SHOWN_MS.store(ms, Ordering::Relaxed);
}

// Windows' tray click sequence briefly drops focus before the panel can grab
// it, which would otherwise trigger the click-outside-to-hide handler the
// instant we showed the window.
pub fn recently_shown(window_ms: u64) -> bool {
    let last = LAST_SHOWN_MS.load(Ordering::Relaxed);
    let now = APP_START.elapsed().as_millis() as u64;
    now.saturating_sub(last) < window_ms
}

pub fn setup(app: &App) -> tauri::Result<()> {
    Lazy::force(&APP_START);
    let show_item = MenuItem::with_id(app, "show", "Show panel", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit SkyDimo", true, Some("CmdOrCtrl+Q"))?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    let icon = Image::from_bytes(TRAY_ICON_PNG)?;

    TrayIconBuilder::with_id("skydimo-tray")
        .icon(icon)
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("panel") {
                    let _ = show_panel(&window, None);
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("panel") {
                    let visible = window.is_visible().unwrap_or(false);
                    if visible {
                        let _ = window.hide();
                    } else {
                        let scale = window
                            .current_monitor()
                            .ok()
                            .flatten()
                            .map(|m| m.scale_factor())
                            .unwrap_or(1.0);
                        let pos = match rect.position {
                            tauri::Position::Physical(p) => p,
                            tauri::Position::Logical(p) => p.to_physical::<i32>(scale),
                        };
                        let size = match rect.size {
                            tauri::Size::Physical(s) => s,
                            tauri::Size::Logical(s) => s.to_physical::<u32>(scale),
                        };
                        let _ = show_panel(&window, Some((pos, size)));
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

fn show_panel(
    window: &WebviewWindow,
    icon: Option<(PhysicalPosition<i32>, PhysicalSize<u32>)>,
) -> tauri::Result<()> {
    if let Some((icon_pos, icon_size)) = icon {
        let monitor = window.current_monitor()?;
        let scale = monitor.as_ref().map(|m| m.scale_factor()).unwrap_or(1.0);
        let size = window.outer_size()?;

        let icon_left = icon_pos.x as f64 / scale;
        let icon_top = icon_pos.y as f64 / scale;
        let icon_w = icon_size.width as f64 / scale;
        let icon_h = icon_size.height as f64 / scale;
        let icon_center_x = icon_left + icon_w / 2.0;
        let icon_bottom = icon_top + icon_h;

        let win_w = size.width as f64 / scale;
        let win_h = size.height as f64 / scale;

        let mut x = icon_center_x - win_w / 2.0;
        // Default: anchor below the icon (macOS menu bar). If there isn't
        // room below (Windows taskbar at the bottom), anchor above instead.
        let mut y = icon_bottom + 6.0;

        if let Some(m) = monitor.as_ref() {
            let mon_left = m.position().x as f64 / scale;
            let mon_top = m.position().y as f64 / scale;
            let mon_right = mon_left + m.size().width as f64 / scale;
            let mon_bottom = mon_top + m.size().height as f64 / scale;

            if y + win_h > mon_bottom - 6.0 {
                y = (icon_top - 6.0 - win_h).max(mon_top + 6.0);
            }

            let min_x = mon_left + 6.0;
            let max_x = mon_right - win_w - 6.0;
            if x < min_x {
                x = min_x;
            }
            if x > max_x {
                x = max_x;
            }
        }

        let _ = window.set_position(LogicalPosition::new(x, y));
    }
    mark_shown();
    window.show()?;
    window.set_focus()?;
    Ok(())
}
