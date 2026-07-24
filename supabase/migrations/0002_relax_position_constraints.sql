-- pos_x/pos_y >= 0 era frágil demais: arrastar a caixa perto da borda do
-- canvas gera arredondamentos de ponto flutuante (ex: -0.0000001) que
-- violavam a checagem sem motivo real — a posição livre é intencional
-- (o requisito é liberdade total, como no Photoshop), não precisa ficar
-- restrita a valores não negativos.

alter table public.template_slots drop constraint if exists template_slots_pos_x_check;
alter table public.template_slots drop constraint if exists template_slots_pos_y_check;
