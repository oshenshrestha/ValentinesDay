export const Fonts = {
  title: "PlayfairDisplay_700Bold",
  body: "Inter_400Regular",
  semibold: "Inter_600SemiBold",
  bold: "Inter_800ExtraBold",
};

export const Type = {
  h1: { fontFamily: Fonts.title, fontSize: 28, letterSpacing: -0.4 },
  h2: { fontFamily: Fonts.title, fontSize: 22, letterSpacing: -0.3 },
  h3: { fontFamily: Fonts.title, fontSize: 18, letterSpacing: -0.2 },

  body: { fontFamily: Fonts.body, fontSize: 16, letterSpacing: -0.1 },
  small: { fontFamily: Fonts.semibold, fontSize: 13, letterSpacing: -0.1 },
  label: { fontFamily: Fonts.bold, fontSize: 12, letterSpacing: 0.4 },

  button: { fontFamily: Fonts.bold, fontSize: 16, letterSpacing: -0.2 },
};
