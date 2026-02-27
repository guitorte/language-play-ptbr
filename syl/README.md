# 🎛️ Sintetizador Fonético PRO

Um motor de busca e exploração fonética projetado para poetas, compositores, linguistas e curiosos. Mais do que um simples dicionário de rimas, o **Sintetizador Fonético** permite "esculpir" palavras com base em métrica silábica, acentuação, assonância e eco consonantal, usando uma interface revolucionária focada no paradigma **Mobile-First**.

![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Mobile First](https://img.shields.io/badge/Design-Mobile_First-000000?style=for-the-badge&logo=apple&logoColor=white)
![No Dependencies](https://img.shields.io/badge/Dependencies-None-2ea44f?style=for-the-badge)

---

## 📱 O Paradigma de Usabilidade (Estatuto do Polegar)

A interface deste projeto foi construída sob rígidas regras de ergonomia móvel:
* **A Zona do Polegar (Thumb Zone):** Todos os controles, filtros e abas residem em um painel inferior (*Bottom Sheet*). A metade superior da tela é dedicada exclusivamente à visualização de dados. Sem "esticar o dedo" até o topo.
* **Auto-Collapse Inteligente:** Ao rolar os resultados para baixo, o painel de controles se retrai suavemente para maximizar a área de leitura.
* **Construtor Visual (Zero Digitação):** Você pode buscar palavras sem digitar uma única letra, usando "Steppers" e botões grandes dimensionados pela Lei de Fitts (alvos de toque ideais).
* **Proteções Android/iOS:** Uso de `100dvh` para evitar quebras de layout com o teclado virtual e `overscroll-behavior-y: contain` para impedir o recarregamento acidental (Pull-to-Refresh) no meio de uma busca.

---

## 🚀 Funcionalidades Principais

O aplicativo é dividido em três laboratórios de experimentação fonética:

### 1. 🔍 Molde (O Método Lego)
Busque uma palavra-base (ex: *Fogo*). O sistema extrai as características dessa palavra (ex: 2 sílabas, paroxítona, vogal 'O', onset 'F') e as transforma em pílulas (Legos) na tela.
* Toque em uma pílula para **trancar (🔒)** essa característica como um filtro absoluto.

### 2. 🎛️ Pesos (O Equalizador)
Se você não quer filtros absolutos, mas sim buscar por *proximidade*, ajuste os sliders matemáticos:
* **Rima Perfeita:** Peso para finais fonéticos idênticos.
* **Assonância (Vogais):** Peso para compartilhamento da mesma vogal tônica.
* **Eco Consonantal:** Peso para aliterações no início da sílaba tônica (Onset).
* **Espinha Vocal:** Peso para palavras que possuem a mesma sequência exata de vogais.

### 3. 🏗️ Raio-X (Construtor)
Não tem uma palavra em mente? Crie um "esqueleto" fonético:
* *Exemplo:* Quero uma palavra de **4 sílabas** `[+]`, que seja **Proparoxítona** `[O]`, com a vogal tônica **'A'** `[O]`. O grid atualiza em tempo real.

---

## ⚙️ Arquitetura e Performance (Under the Hood)

O projeto é inteiramente **Vanilla** (HTML, CSS e JS puros num único arquivo), mas utiliza padrões de arquitetura de alta performance:

* **Motor Prosódico Local:** Separação silábica complexa, identificação de dígrafos, divisão de hiatos e extração de tônica e onsets feitas em milissegundos no navegador (Client-side).
* **Intersection Observer (Infinite Scroll):** Esqueça a paginação lenta ou travamentos do DOM. O app processa milhares de palavras na memória, mas injeta os cards na tela em "chunks" de 60 itens apenas quando o usuário chega ao fim da página.
* **Debouncing:** Os sliders do equalizador calculam a matemática de todo o dicionário. Para não "derreter" a CPU do celular, o recálculo só é acionado 150ms após o dedo parar de mover o slider.

---

## 🛠️ Como Instalar e Rodar

Como o projeto faz o carregamento de um arquivo local via `fetch()`, ele não pode ser aberto com um simples "duplo-clique" no arquivo HTML (`file://`) devido às políticas de segurança (CORS) dos navegadores.

### Passos:
1. Clone ou baixe este repositório.
2. Certifique-se de ter dois arquivos na mesma pasta:
   * `sintetizador.html` (O código do aplicativo)
   * `palavras.txt` (O dicionário de palavras)
3. **Formato do `palavras.txt`:** Deve ser um arquivo de texto simples, com uma palavra por linha. Exemplo:
   ```text
   abacate
   casa
   fogo
   poesia
   ```
4. **Para rodar:**
   * **Opção A (VS Code):** Instale a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer). Clique com o botão direito no `sintetizador.html` e selecione *"Open with Live Server"*.
   * **Opção B (Python):** Abra o terminal na pasta e digite `python -m http.server 8000`. Acesse `http://localhost:8000/sintetizador.html` no seu navegador.

---

## 📝 Próximos Passos (Roadmap)
- [ ] Implementar Modo Noturno (Dark Mode) automático.
- [ ] Adicionar suporte para exportar (copiar) listas de rimas favoritas.
-[ ] Cacheamento do IndexedDB para salvar o dicionário compilado no navegador, acelerando a inicialização em 300%.
- [ ] Integração com a Web Speech API para busca e filtragem por voz.

---

## 📜 Licença
Este projeto é open-source. Sinta-se livre para modificar, estudar as soluções de contorno para mobile (como o `100dvh` e o `overscroll-behavior`) e adaptar para o seu próprio dicionário ou idioma. 

**Projetado para ser usado com apenas um polegar. Dedos descansados criam rimas melhores.** ✌️
