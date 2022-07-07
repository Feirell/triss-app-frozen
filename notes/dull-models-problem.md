Ich habe mehrere Vermutungen:

a) Die Umwandlung die Kenny gemacht hat, von seiner internen Version zu gltf, sind nicht korrekt abgelaufen.
Das würde erklären, warum alle Materiallilien "metalness" auf 1 haben.

https://github.khronos.org/glTF-Validator/ sagt auch das die vorgefertigten gld einen Fehler bezüglich der Hirarchie haben.

b) PBR Materialien sind mit einer weiteren Konfiguration zu versehen.

https://www.reddit.com/r/Unity3D/comments/41fbap/why_does_my_terrain_texture_look_dull_and_washed/
https://discourse.threejs.org/t/whats-this-about-gammafactor/4264
https://discourse.threejs.org/t/gltfexported-model-is-way-darker/6686:

- gamma auf render:
  - renderer.gammaOutput = true;
  - renderer.gammaFactor = 2.2;
- encoding auf sRGB der Materialien

c) sRGB macht irgendwas seltsam, einfach linear benutzen und die OBJ Dateien verwenden, dann hat man wieder Farben.

d) Es braucht eine bestimmte Option in obj2gltf (https://github.com/CesiumGS/obj2gltf) damit das Modell richtig aussieht.
Ist allerdings unwahrscheinlich, weil alle Informationen auf der OBJ, meines Erachtens, richtig transferiert worden sind.
Vielleicht die Option "unlit"?

Darüber hinaus ist seltsam das in dem Windwos 3D Objekt betrachter die OBJ so wie in der Vorschau png dargestellt werden.
gltf allerdings ausgewaschen sind. Das gleich lässt sich (ohne sRGB) auch unter three js beobachten.

Lesen:

https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html
