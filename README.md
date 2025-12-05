# Painel CERTA FCEE

Projeto estático com Painel Estatístico e Painel Admin para o Centro de Referência em Tecnologia Assistiva (CERTA) da Fundação Catarinense de Educação Especial.

## Estrutura
- `index.html`: Painel Estatístico com gráficos e mapa.
- `admin.html`: Painel Admin com login, cadastro de instituições, colunas de quantidade dinâmicas e links para mapa e saída.
- `data/instituicoes.csv`: Cadastro inicial das instituições CERTA com quantidades zeradas.
- `scripts/`: Lógica compartilhada, dashboard e administração.
- `styles/style.css`: Estilos gerais dos painéis.

## Uso
Abra `index.html` para visualizar o painel público e `admin.html` para o painel administrativo. As credenciais padrão do admin são **usuário** `admin` e **senha** `certa2024`. Os dados são persistidos no `localStorage` do navegador.
