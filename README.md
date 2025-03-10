# **BoothBattle - Juego de Artillería con Detección de Posturas**

**BoothBattle** es un juego de artillería en el que los jugadores controlan tanques y deben ajustar el ángulo y la potencia de sus disparos para derribar a sus oponentes. Lo innovador de este demo es su integración con la **detección de posturas del jugador**, lo que permite un control del juego basado en los movimientos del cuerpo.

## **Características del Juego**

- **Control por Postura**: Utilizando **TensorFlow.js**, el juego detecta los movimientos del jugador a través de la cámara web. Esto permite a los jugadores disparar el proyectil al realizar un gesto específico (por ejemplo, levantar el brazo), convirtiendo el control en una experiencia inmersiva y dinámica.
  
- **Físicas**: Los proyectiles se mueven de acuerdo con las leyes físicas, calculando la trayectoria y el impacto de los disparos, lo que agrega un nivel de desafío y estrategia al juego.

- **Interfaz de Usuario**: El juego incluye estadísticas en tiempo real sobre la distancia de los disparos, el ángulo y el estado del tanque, proporcionando al jugador información clave para tomar decisiones estratégicas.

## **Tecnologías Utilizadas**

- **TensorFlow.js**: Usado para la **detección de posturas** en tiempo real, permitiendo que el jugador controle el juego mediante gestos corporales. TensorFlow.js proporciona un modelo de pose de alta precisión para rastrear el cuerpo humano.

- **TypeScript**: El juego está desarrollado en **TypeScript**, lo que asegura un código más robusto y fácil de mantener. El uso de tipado estático mejora la calidad del desarrollo y la detección de errores.

- **Vite**: Utilizado como bundler, **Vite** optimiza el flujo de trabajo y la experiencia de desarrollo con recarga en vivo y tiempos de construcción rápidos. También mejora el rendimiento de la carga y la ejecución del juego.

---

## **Estructura del Proyecto**

El proyecto está organizado en módulos independientes, cada uno responsable de una funcionalidad específica del juego, tales como:

- `gameState.ts` - Manejo de los estados del juego (jugadores, disparos, colisiones).
- `player.ts` - Lógica del jugador y control del tanque.
- `arrow.ts` - Gestión de los proyectiles y su física.
- `poseDetection.ts` - Integración de TensorFlow.js para la detección de posturas.
- `drawing.ts` - Renderizado de la interfaz gráfica y los elementos del juego.
- `geometry.ts` - Cálculos geométricos para la trayectoria de los proyectiles.

--- 

## **Instrucciones de Juego**

### **Cómo iniciar el modo de disparo:**

1. **Posición Inicial:**
   - El jugador debe estar en posición vertical frente a la cámara web, con los brazos relajados a los lados.

2. **Iniciar el Modo de Disparo:**
   - **Jugador en el lado izquierdo de la pantalla**: Lleva tu **muñeca izquierda** hacia tu **hombro derecho**. Este gesto inicia el **modo de disparo**.
   - **Jugador en el lado derecho de la pantalla**: Lleva tu **muñeca derecha** hacia tu **hombro izquierdo**. Esto también activará el **modo de disparo**.

### **Control del Disparo:**

Una vez que hayas activado el modo de disparo, podrás ajustar la dirección y la potencia del disparo de la siguiente manera:

- **Apuntar**: Mueve tu **brazo derecho (o izquierdo si eres el jugador en el lado derecho)** hacia arriba o hacia abajo para ajustar el **ángulo de disparo**.
  
- **Ajustar Potencia**: La potencia del disparo se ajusta de manera horizontal, moviendo la **muñeca** más cerca o más lejos del **hombro** (simulando cómo se sostiene un arco). Cuanto más lejos esté la muñeca del hombro, mayor será la potencia del disparo.

### **Consejos de Juego:**
- Para un disparo más preciso, asegúrate de mantener los movimientos controlados y realizar el gesto de disparo con claridad.
- Experimenta con los ángulos y la potencia para encontrar la mejor manera de acertar a tu oponente.
- Es importante que la cámara este colocada a una distancia suficiente para cubrir el cuerpo de ambos jugadores.

---

## **Instalación**

1. Clona el repositorio:
    ```bash
    git clone https://github.com/tu_usuario/boothbattle.git
    ```

2. Instala las dependencias:
    ```bash
    cd boothbattle
    npm install
    ```

3. Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```

4. Abre el juego en tu navegador accediendo a `http://localhost:5173`.
