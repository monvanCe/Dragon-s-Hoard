export const LOCAL_ASSET_BASE = `${import.meta.env.BASE_URL}assets`;

export const LOCAL_ASSET_PATHS = {
  backgrounds: {
    menu: `${LOCAL_ASSET_BASE}/backgrounds/menu.png`,
    ace: `${LOCAL_ASSET_BASE}/backgrounds/ace.png`,
    magic: `${LOCAL_ASSET_BASE}/backgrounds/magic.png`,
    phoenix: `${LOCAL_ASSET_BASE}/backgrounds/phoenix.png`,
  },
  ui: {
    buttonIdle: `${LOCAL_ASSET_BASE}/ui/button-idle.png`,
    buttonHover: `${LOCAL_ASSET_BASE}/ui/button-hover.png`,
    panelFrame: `${LOCAL_ASSET_BASE}/ui/panel-frame.png`,
  },
  ace: {
    cardFront: `${LOCAL_ASSET_BASE}/ace/card-front.png`,
    cardGlow: `${LOCAL_ASSET_BASE}/ace/card-glow.png`,
  },
  phoenix: {
    flame: `${LOCAL_ASSET_BASE}/phoenix/flame.png`,
    ember: `${LOCAL_ASSET_BASE}/phoenix/ember.png`,
  },
  particles: {
    spark: `${LOCAL_ASSET_BASE}/particles/spark.png`,
  },
} as const;
