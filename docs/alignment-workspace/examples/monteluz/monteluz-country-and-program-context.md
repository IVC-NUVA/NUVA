# República de Monteluz: contexto del país y del programa de vacunación

> **Material completamente ficticio.** La República de Monteluz, su autoridad sanitaria, su programa de inmunización y los códigos `MLZ-*` fueron creados únicamente para probar un espacio de alineación terminológica. No representan el calendario, la política ni el sistema de codificación de ningún país real.

## Propósito y alcance

Este ejercicio produce un sistema fuente de códigos para registrar vacunas administradas. El catálogo se diseñó después de revisar prácticas de vacunación vigentes en varios países latinoamericanos y orientación regional e internacional, pero no copia el calendario de un país ni deriva su estructura de otro sistema terminológico.

El archivo `monteluz-vaccine-codes.csv` contiene conceptos de vacuna o formulación. No codifica número de dosis, edad, elegibilidad, clínica, financiador, campaña ni lugar de administración. Esos datos pertenecerían a otros campos del registro de vacunación.

## País ficticio

La República de Monteluz es un país hispanohablante de ingreso medio con unos 18 millones de habitantes. Tiene dos grandes áreas metropolitanas, ciudades intermedias, comunidades rurales dispersas, cordilleras templadas y tierras bajas tropicales. La movilidad interna es alta y existen corredores de migración y turismo internacional.

El sistema de salud combina:

- una red nacional de atención primaria y hospitales públicos;
- servicios de seguridad social;
- prestadores privados y farmacias autorizadas;
- brigadas móviles para comunidades rurales y respuesta a brotes; y
- un registro nominal nacional que recibe datos de todos esos sectores.

La **Dirección Nacional de Inmunizaciones de Monteluz** y el **Registro Nacional de Vacunación de Monteluz** son entidades ficticias. El programa adquiere gran parte de sus vacunas mediante mecanismos regionales semejantes a los utilizados en las Américas, pero también recibe registros de productos comprados por el sector privado o administrados en el extranjero.

## Poblaciones y usos cubiertos

El programa contempla vacunación a lo largo del curso de vida:

- recién nacidos, lactantes, niñas y niños;
- adolescentes;
- personas embarazadas;
- adultos y adultos mayores;
- personal de salud, laboratorio y otros trabajadores expuestos;
- personas con enfermedades crónicas o inmunocompromiso;
- viajeros, migrantes y personas vacunadas fuera del país; y
- poblaciones afectadas por brotes o riesgos geográficos.

El catálogo incluye vacunas rutinarias infantiles, refuerzos de adolescentes y adultos, vacunación materna, campañas estacionales, productos para riesgo clínico, vacunas de viaje y productos utilizados en respuesta a brotes. También conserva códigos históricos necesarios para interpretar registros antiguos.

## Supuestos regionales que orientaron el catálogo

La revisión mostró un núcleo regional relativamente estable: BCG y hepatitis B al inicio de la vida; combinaciones con difteria, tétanos, tosferina, hepatitis B y Hib; poliomielitis, rotavirus y neumococo en lactantes; SRP, varicela y hepatitis A en la infancia; VPH en adolescentes; e influenza, COVID-19, Td/Tdap y neumococo para grupos definidos a lo largo de la vida.

También aparecen variaciones relevantes entre países y sectores:

- combinación pentavalente o hexavalente y componente pertúsico celular o acelular;
- transición de vacuna oral a inactivada contra poliomielitis;
- diferentes valencias de vacunas neumocócicas, meningocócicas, de VPH, rotavirus e influenza;
- uso geográfico de fiebre amarilla y uso focalizado de rabia y fiebre tifoidea;
- coexistencia de productos públicos, privados e importados; y
- incorporación gradual de vacunas contra VSR, mpox y herpes zóster.

Monteluz se supone tropical en parte de su territorio, por lo que la fiebre amarilla es programática en zonas de riesgo y pertinente para viajeros. La rabia se registra en profilaxis preexposición y posexposición. Las vacunas contra fiebre tifoidea, cólera y meningococo se usan de manera selectiva. La influenza y COVID-19 se administran mediante campañas periódicas y pueden cambiar de composición sin que cada temporada genere necesariamente un código fuente nuevo.

## Separación entre calendario y terminología

El calendario responde preguntas como quién debe vacunarse, cuándo, cuántas dosis necesita y bajo qué condición. El sistema de códigos responde qué vacuna fue administrada.

Por esa razón:

- una misma vacuna conserva su código en la serie primaria, el refuerzo o una campaña;
- la vacuna antirrábica no cambia de código entre profilaxis preexposición y posexposición;
- la fiebre amarilla no recibe códigos distintos por residencia, viaje o brote;
- la composición estacional de influenza y COVID-19 se registra como información de producto o lote cuando está disponible; y
- las diferencias pediátricas y de adultos solo se codifican cuando la formulación o el contenido antigénico realmente cambia.

## Modelo del sistema de códigos

El catálogo contiene 48 conceptos y utiliza identificadores estables `MLZ-001` a `MLZ-048`. Los rótulos están pensados como valores de visualización. Las descripciones son la definición operativa y prevalecen cuando el rótulo corto no basta.

El sistema mezcla deliberadamente distintos niveles de especificidad que serían plausibles en una fuente nacional:

- categorías genéricas para uso rutinario;
- combinaciones antigénicas explícitas;
- formulaciones diferenciadas por plataforma, valencia o población cuando esto modifica el producto administrado;
- conceptos no especificados para documentación insuficiente; y
- códigos inactivos retenidos para registros históricos.

No se incluyeron marcas comerciales, presentaciones por fabricante, códigos de lote ni códigos separados por dosis o edad. Un sistema operacional podría mantener esos datos en tablas relacionadas.

## Casos de borde previstos para la alineación

| Código | Problema terminológico realista |
|---|---|
| `MLZ-003` | El rótulo «Pentavalente celular» no basta fuera del contexto local; la descripción define DTPw-HepB-Hib. |
| `MLZ-004` | La hexavalente celular exige revisar seis componentes y distinguirla de la hexavalente acelular. |
| `MLZ-013` | La vacuna oral bivalente contra poliomielitis es histórica y se solapa en finalidad con la IPV actual, pero no es el mismo producto. |
| `MLZ-014` | «Antipoliomielítica no especificada» abarca más de una formulación posible y no debe alinearse por suposición. |
| `MLZ-024` | «Meningocócica no especificada» no declara serogrupos ni tecnología. |
| `MLZ-036` | El código heredado de VPH no indica si la vacuna fue tetravalente o nonavalente; fecha y producto podrían resolverlo. |
| `MLZ-041` | El concepto de COVID-19 no especificado puede cubrir plataformas y formulaciones etarias diferentes. |

Los conceptos no especificados son válidos para conservar el significado limitado del documento fuente. No deben utilizarse como sustitutos cómodos cuando el producto preciso sí está disponible.

## Hallazgos directos de las fuentes

- Brasil documenta en 2026 un calendario infantil con BCG, hepatitis B, pentavalente, IPV, rotavirus, vacunas neumocócicas conjugadas, meningocócicas C y ACWY, SRP, varicela, hepatitis A, fiebre amarilla, influenza, COVID-19 y VPH.
- Ecuador documenta en 2026 vacunas del esquema nacional y del sector privado, incluidas formulaciones celulares y acelulares, PCV13 y PCV20, VPH tetravalente y nonavalente, rabia, influenza, COVID-19, mpox, VSR, PPSV23, fiebre tifoidea, hepatitis A, meningococo y herpes zóster.
- Colombia presenta un enfoque de curso de vida con grupos infantiles, adolescentes, gestantes, adultos mayores, viajeros, personal de salud y personas con comorbilidades. También mantiene orientación específica para fiebre amarilla, sarampión y VPH.
- Argentina conserva el uso de SRP y SR y publica datos nominales de cobertura para vacunas del calendario nacional.
- México utiliza vacuna estacional tetravalente contra influenza en los lineamientos de la temporada invernal 2025–2026.
- Uruguay publica un esquema nacional que incluye vacunas a lo largo del curso de vida y permite contrastar variaciones del Cono Sur.

## Conclusiones inferidas entre fuentes

Las siguientes decisiones no provienen literalmente de una sola fuente. Son inferencias de diseño obtenidas al comparar prácticas:

1. **Un registro nacional necesita mayor amplitud que el calendario público.** Los prestadores privados, viajeros y migrantes introducen formulaciones que no son el producto preferido del programa.
2. **La transición tecnológica deja coexistencia histórica.** IPV y vacuna oral contra poliomielitis, PCV10 y vacunas conjugadas de mayor valencia, y varias plataformas de COVID-19 pueden aparecer en un mismo repositorio longitudinal.
3. **Los códigos de combinación deben declarar componentes.** Los términos «pentavalente» y «hexavalente» no garantizan por sí solos una composición uniforme entre países o sectores.
4. **La pérdida de precisión debe representarse sin inventar datos.** Los conceptos no especificados permiten registrar un carné o certificado incompleto sin atribuirle una valencia o plataforma no documentada.
5. **La estacionalidad no siempre exige un código nuevo.** Para influenza y COVID-19, la plataforma o formulación puede ser parte del concepto mientras que cepa, variante, fabricante y lote se conservan como atributos operacionales.
6. **La geografía modifica la indicación, no necesariamente el producto.** Riesgo tropical, viaje o brote justifican la administración de fiebre amarilla, rabia u otras vacunas, pero no crean automáticamente conceptos vacunales diferentes.

## Fuentes consultadas

Fecha de acceso para todas las fuentes: **2026-09-17**.

| Organización responsable | Documento o página | Fecha de publicación o actualización | URL | Uso en el diseño |
|---|---|---|---|---|
| Ministerio de Salud de Brasil | *Calendário Nacional de Vacinação 2026 — Vacinas da Criança* | 2026 | https://www.gov.br/saude/pt-br/vacinacao/arquivos/calendario-nacional-de-vacinacao-crianca | Núcleo infantil, combinaciones, transición de valencias neumocócicas, meningococo, fiebre amarilla, influenza, COVID-19 y VPH. |
| Ministerio de Salud Pública del Ecuador, Dirección Nacional de Inmunizaciones | *Manual Inmunizaciones para la Salud 2026* | 2026 | https://www.salud.gob.ec/wp-content/uploads/2026/09/Manual-Inmunizaciones_portada_18x25cm_v2_digi.pdf | Composición de combinaciones, formulaciones públicas y privadas, vacunas complementarias, curso de vida y grupos especiales. |
| Ministerio de Salud Pública del Ecuador | *Esquema Nacional de Vacunación 2026* | 2026 | https://www.salud.gob.ec/wp-content/uploads/2026/09/INFOGRAFIA-2026-07-VACUNACION.pdf | Contraste entre productos del esquema y vacunas complementarias descritas en el manual. |
| Ministerio de Salud y Protección Social de Colombia, Programa Ampliado de Inmunizaciones | *Vacunación en el curso de la vida* | Sin fecha visible | https://vacunacion.minsalud.gov.co/EV/Paginas/vacunacion-en-elvacunacion-en-el-curso-de-vida-curso-de-vida.aspx | Poblaciones objetivo y enfoque de vacunación durante toda la vida. |
| Ministerio de Salud y Protección Social de Colombia, Programa Ampliado de Inmunizaciones | *Viajeros* | Contenido actualizado con directrices de 2026 | https://vacunacion.minsalud.gov.co/EV/Paginas/viajeros.aspx | Fiebre amarilla, sarampión, viajeros, personal expuesto y respuesta epidemiológica. |
| Ministerio de Salud y Protección Social de Colombia, Programa Ampliado de Inmunizaciones | *Vacunación contra el VPH* | Sin fecha visible; esquema vigente consultado en 2026 | https://vacunacion.minsalud.gov.co/EV/Paginas/vacunacion-contra-vph.aspx | VPH para niñas y niños, dosis única en población sana y necesidad de distinguir vacuna de esquema. |
| Ministerio de Salud de la Nación Argentina | *Triple viral / doble viral* | Sin fecha de actualización visible | https://www.argentina.gob.ar/salud/vacunas/doble-triple-viral | Diferenciación de SRP y SR y su uso en personas susceptibles y personal de salud. |
| Ministerio de Salud de la Nación Argentina | *Coberturas de vacunación. Calendario Nacional 2025* | Actualizado el 2026-09-02 | https://www.argentina.gob.ar/sites/default/files/2019/05/nacion_-_cnv_2025_-_publicacion_final_02_09_2026.pdf | Comprobación de vacunas efectivamente registradas en un sistema nominal y persistencia de denominaciones programáticas. |
| Secretaría de Salud de México | *Lineamientos de vacunación para la temporada invernal 2025–2026* | 2025 | https://www.gob.mx/cms/uploads/attachment/file/1033013/Lineamientos_Temporada_invernal_2025-2026_Vf__2_.pdf | Uso estacional de influenza tetravalente y campañas respiratorias. |
| Ministerio de Salud Pública de Uruguay | *Esquema nacional de vacunación* | Publicado en 2025; fecha exacta no visible en el resultado consultado | https://www.gub.uy/ministerio-salud-publica/comunicacion/publicaciones/esquema-nacional-vacunacion | Variaciones del Cono Sur y vacunación a lo largo del curso de vida. |
| Organización Panamericana de la Salud | *Inmunización* | Sin fecha visible | https://www.paho.org/es/temas/inmunizacion | Contexto regional del PAI, vacunación a lo largo de la vida y enfermedades prevenibles por vacunación en las Américas. |
| Organización Panamericana de la Salud | *Fondo Rotatorio para el Acceso a las Vacunas* | Sin fecha visible | https://www.paho.org/es/fondo-rotatorio | Supuesto de adquisición regional y coexistencia de productos según disponibilidad programática. |
| Organización Mundial de la Salud | *Vacunas e inmunización: ¿qué es la vacunación?* | 2025-10-22 | https://www.who.int/es/news-room/questions-and-answers/item/vaccines-and-immunization-what-is-vaccination | Marco general para distinguir vacuna, vacunación y calendario nacional. |

## Limitaciones

Este no es un calendario clínico y no debe usarse para decidir indicaciones, intervalos ni contraindicaciones. El catálogo no pretende reproducir todo producto autorizado en América Latina. Selecciona un conjunto manejable y plausible para poner a prueba decisiones de alineación, incluida la preservación de ambigüedad y de historia terminológica.

No se consultó ni utilizó NUVA para crear estos conceptos. El material no contiene códigos NUVA, CVX, identificadores de valencia ni un mapa de respuestas.
