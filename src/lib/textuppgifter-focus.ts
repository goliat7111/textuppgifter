export const FOCUS_AREAS = {
  arithmetic: "Räknesätt",
  algebra: "Algebra",
  geometry: "Geometri",
  probabilityStatistics: "Sannolikhet och statistik",
  combinatorics: "Kombinatorik",
} as const;
export type FocusArea = keyof typeof FOCUS_AREAS;
export const FOCUS_PROMPTS: Record<Exclude<FocusArea, "arithmetic">, string> = {
  algebra:
    "Fokusera på algebra: mönster, obekanta tal och likheter för yngre elever, uttryck och ekvationer för äldre elever. Uppgifterna ska träna algebraiskt resonemang, inte bara vanlig huvudräkning.",
  geometry:
    "Fokusera på geometri: former, längd och omkrets för yngre elever, area, vinklar och volym när det passar årskursen. Ange alla mått och enheter. Uppgifterna ska kunna lösas utan en bild som inte finns med.",
  probabilityStatistics:
    "Fokusera på sannolikhet och statistik, med båda delarna representerade. Använd enkla slumpförsök och frekvenser för yngre elever, sannolikhetsberäkningar och lämpliga lägesmått för äldre elever. Ange samtliga data i texten. Hänvisa inte till diagram som saknas.",
  combinatorics:
    "Fokusera på kombinatorik: systematisk uppräkning av val och kombinationer för yngre elever, multiplikationsprincipen och ordnade val för äldre elever. Ange tydligt om ordningen spelar roll och om samma alternativ får väljas flera gånger.",
};
export const GEOMETRY_AREAS = {
  plane: "2D-geometri",
  solids: "3D-geometri",
  space: "Rymdgeometri",
  scale: "Skala",
} as const;
export type GeometryArea = keyof typeof GEOMETRY_AREAS;
export const GEOMETRY_PROMPTS: Record<GeometryArea, string> = {
  plane:
    "Endast 2D-geometri: plana figurer, egenskaper, symmetri, omkrets, area och vinklar efter årskurs. Inga uppgifter om volym.",
  solids:
    "3D-geometri med fokus på geometriska kroppars egenskaper: kub, rätblock, prisma, pyramid, cylinder, kon och klot. Träna namn, sidoytor, kanter, hörn och utvecklingsbara nät efter årskurs. Beskriv allt i text; kräv ingen saknad bild.",
  space:
    "Rymdgeometri med fokus på beräkningar och rumsliga samband: volym, begränsningsarea, kapacitet och volymenheter efter årskurs. För yngre elever används konkreta klossar och enkla rätblock. Ange alla nödvändiga mått och korrekta enheter.",
  scale:
    "Endast skala: kartor, ritningar, modeller, förstoring och förminskning. Ange skalan och alla nödvändiga mått. Anpassa enhetsbyten och skalnotation efter årskursen. Skilj längdskala från area- och volymskala; använd de senare endast när årskursen motiverar det.",
};
