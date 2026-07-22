# Configurar o OBS Studio

Isso é feito **uma vez por computador que roda o OBS**. Depois disso, trocar o conteúdo ou a mensagem exibida não exige mexer mais no OBS.

## 1. Pegue o link do evento

1. No site, abra o evento (a Missa/evento do dia) em **Controlar**.
2. Copie o link mostrado em "Link do OBS (Browser Source)" — algo como `https://.../overlay/xxxxxxxx-xxxx-...`.

Esse link é diferente para cada evento (cada Missa nova tem seu próprio link). Você pode reaproveitar o mesmo evento durante toda a Missa; só crie um novo evento na próxima celebração.

## 2. Adicione a fonte no OBS

1. Na cena da transmissão, clique em **+** na lista de Fontes → **Navegador (Browser Source)**.
2. Dê um nome (ex: "Legendas da Missa") e clique OK.
3. Nas propriedades:
   - **URL**: cole o link copiado no passo 1.
   - **Largura**: `1920`
   - **Altura**: `1080`
   - **Desmarque** "Encerrar a fonte quando não estiver visível" (assim ela continua conectada e atualizando mesmo se você trocar de cena).
   - FPS pode ficar no padrão.
4. Clique OK.

A fonte vai aparecer com fundo transparente — nada é exibido até que um operador ative uma mensagem na tela de **Controlar**.

## 3. Posicione na cena

A fonte sempre representa um quadro de 1920×1080. Redimensione/posicione ela na cena do OBS como preferir (ex: cobrindo a tela toda, já que as mensagens em si já têm a posição configurada dentro do template).

## 4. Teste antes de ir ao ar

1. Peça para um operador abrir a tela de **Controlar** do evento e clicar em uma das mensagens.
2. Confirme que ela aparece no OBS em poucos segundos, sem precisar clicar em "Atualizar navegador" (refresh) na fonte.
3. Clique em "Ocultar tudo" e confirme que a mensagem some.

Se a mensagem não aparecer automaticamente, o problema mais comum é o computador do OBS sem internet, ou o link copiado errado (de outro evento).

## Recomendação para a primeira transmissão real

Faça um ensaio completo (uma Missa fictícia, do início ao fim) antes de usar isso pela primeira vez ao vivo, e mantenha o Photoshop como plano B nessa primeira vez.
