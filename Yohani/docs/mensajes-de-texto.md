# Mensajes de texto de las citas

Esto es lo que hay que preparar para que Yohani pueda mandar un mensaje de texto desde el panel. Todavía no está conectado. Los botones de Confirmar y Reprogramar ya guardan la cita. El mensaje se engancha cuando la cuenta de textos esté lista.

## Qué servicio usar

Firebase no manda este tipo de mensaje. Firebase avisa dentro de una aplicación, o manda un código corto para entrar a una cuenta. No deja escribir “Yohani confirmó tu cita del martes a las 10:00” y enviarlo al teléfono de la clienta.

El servicio que sí lo hace es **Twilio**. No es una franquicia ni una mensualidad cerrada. Se paga el número de teléfono y cada mensaje que sale.

## Qué comprar

1. Una cuenta en [twilio.com/try-twilio](https://www.twilio.com/try-twilio).
2. El periodo de prueba es gratis, pero solo manda textos a números que tú verifiques a mano, máximo unos cinco. Sirve para probar con tu propio celular. No sirve para las clientas.
3. Para las clientas hay que pasar la cuenta a paga. En la consola de Twilio se ve el precio de cada paso:
   - un número de Estados Unidos, con una cuota mensual;
   - cada mensaje de texto, cobrado por mensaje;
   - el registro del negocio para poder mandar textos comerciales en Estados Unidos. Ese registro se llama A2P 10DLC. La marca suele aprobarse en minutos. La campaña tarda unos 10 a 15 días hábiles. Sin ese registro, las operadoras bloquean los textos.

No hace falta un plan de cientos de dólares al mes. El gasto de Yohani es el número, más unos centavos por cada cita confirmada o reprogramada, más el registro que la consola muestra al inscribir el negocio.

## Qué hay que registrar

En la consola de Twilio, en este orden:

1. Verificar el correo y el teléfono personal.
2. Pasar la cuenta de prueba a cuenta de pago cuando se vaya a escribir a clientas reales.
3. Comprar un número local de Estados Unidos.
4. Crear el perfil del negocio en Trust Hub.
5. Registrar la marca (nombre del negocio, dirección, EIN si lo tiene, sitio web).
6. Registrar la campaña. Ahí se pegan dos ejemplos de mensaje y se explica cómo la clienta acepta recibir el texto. La revisión tarda de 10 a 15 días hábiles.
7. Unir el número comprado a esa campaña.

Ejemplos que vamos a usar en la campaña:

- Confirmación: “Yohani confirmó tu cita el martes 11 de noviembre a las 10:00 a.m. Si necesitas cambiarla, avísanos.”
- Reprogramación: “Yohani movió tu cita al jueves 13 de noviembre a las 11:00 a.m.”

La clienta acepta el texto al enviar la solicitud en la página. Antes de salir a producción hay que dejar esa aceptación escrita en el formulario, junto con “pueden aplicar tarifas de mensaje” y la forma de responder STOP para no recibir más. Twilio revisa esa frase. Si no está, rechazan la campaña.

## Qué me tienes que pasar cuando la cuenta exista

Estos datos se guardan solo en el servidor, en la configuración de la API. No van en la página.

- Account SID
- API Key SID y el secreto de esa llave
- El número de Twilio que envía, con el +1
- Messaging Service SID, el que queda después de aprobar la campaña

Con eso conecto dos momentos:

- Al pulsar **Confirmar cita**, sale el texto de confirmación al teléfono guardado en la cita.
- Al pulsar **Guardar horario** en reprogramar, sale el texto con la fecha nueva.

El aviso de la página, el que dice que Yohani va a revisar la cita y que el mensaje llega cuando ella confirme, ya está. Ese aviso no es el mensaje de texto. El texto sale después, desde el panel.
