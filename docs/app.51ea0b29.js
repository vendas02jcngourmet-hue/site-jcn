(function(){
'use strict';
/* Catálogo JCN 2026: textos e fichas (sem preços) */
const CAT26_TEXTOS = ["A banqueta alta é a escolha ideal para quem busca praticidade, conforto e um visual moderno para diversos ambientes. Perfeita para cozinhas, áreas gourmet, bares, bancadas e espaços comerciais. Com design funcional e estrutura resistente, oferece estabilidade e conforto no uso diário. Suas dimensões proporcionam uma altura ideal para bancadas altas.","A chapeira JCN Gourmet é um equipamento utilizado em bares, lanchonetes e demais localidades para produzir lanches e porções quentes a gás. Estrutura em aço inoxidável escovado, que facilita a limpeza, e chapa inteiriça de aço carbono SAE 1020: o calor é retido por mais tempo, alcançando a temperatura necessária para o bom selamento da carne.","A sanduicheira JCN Gourmet é um equipamento para produzir sanduíches quentes a gás. Prensa em aço carbono, que proporciona maior temperatura e maior qualidade no alimento; o corpo externo é confeccionado em aço inox, sinônimo de qualidade e durabilidade.","Banqueta baixa de design moderno, ideal para pé de balcão. Compacta na medida certa, une conforto, praticidade e um visual contemporâneo que combina com qualquer área gourmet. Assento em napa.","Engenho para cana, usado para extrair caldo de cana e destinado ao uso doméstico. Moendas (rolos) em alumínio, engrenagens em ferro fundido e laterais em chapa de aço.","Fogão industrial camping de mesa a gás, com queimador de alta pressão. Ideal para caminhoneiros que precisam de praticidade na estrada ou para quem ama acampar e cozinhar ao ar livre com eficiência. Produto robusto, econômico e fácil de instalar.","Ideal para estabelecimentos que buscam eficiência e praticidade, o tacho fritador a gás em inox de 6 litros é perfeito para frituras rápidas e uniformes. Fabricado em aço inoxidável, oferece alta durabilidade, fácil limpeza e excelente resistência à corrosão. Compacto e funcional, conta com queimador de alta performance que mantém a temperatura estável, garantindo alimentos crocantes e bem preparados.","Ideal para fogões de alta pressão. Produto resistente, com tubo interno em PVC flexível e registro de fechamento de gás, garantindo segurança e praticidade no uso.","Ideal para uma culinária mais rústica, o disco de arado em aço carbono proporciona preparo uniforme, sabor caseiro e alta resistência. Perfeito para carnes, legumes e receitas feitas no fogo.","Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.","Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.","Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.","O cabideiro em aço carbono combina resistência e praticidade no dia a dia, sendo ideal para pendurar roupas, bolsas e acessórios. Seu design se adapta a diferentes estilos de decoração, em halls, quartos ou escritórios.","Os cortadores de legumes JCN Gourmet facilitam na hora de fazer aquelas batatas palito crocantes e saborosas. Ideais para cortar legumes e frutas em palitos e cubos, para uso doméstico, comercial e industrial. É lavável, desmontável e possui base antiderrapante.","Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.","Prática, segura e higiênica: a escolha certa para a sua panificadora. A mesa de panificação em aço inox não contamina os alimentos, não retém odores e é fácil de limpar. Ideal para quem busca qualidade e confiança no preparo diário.","Versátil, potente e durável. O maçarico lança-chamas sapecador é ideal para sapecar carnes, aquecer ferragens, aplicar manta líquida e muito mais. É a ferramenta certa para cozinha, agro e construção."];
const PRECO_COLORS = {};
const CAT26 = [["ff006","industriais","Fogão Perfil 5, 2 bocas, queimadores simples, de mesa","FF006","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","2"],["Versão","De mesa"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"",0,"g-ff006","ferro","Perfil 5, queimadores simples"],["ff008","industriais","Fogão Perfil 5, 2 bocas, queimadores simples","FF008","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","2"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff009",0,"g-ff008","ferro","Perfil 5, queimadores simples","p5p"],["ff029","industriais","Fogão Perfil 5, 3 bocas, queimadores simples","FF029","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","3"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff101",0,"g-ff029","ferro","Perfil 5, queimadores simples","p5p"],["ff010","industriais","Fogão Perfil 5, 4 bocas, queimadores simples","FF010","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","4"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff011",0,"g-ff010","ferro","Perfil 5, queimadores simples","p5g"],["ff020","industriais","Fogão Perfil 5, 6 bocas, queimadores simples","FF020","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","6"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff019",0,"g-ff020","ferro","Perfil 5, queimadores simples","p5g"],["ff983","industriais","Fogão Perfil 5, 1 boca, queimador simples","FF983","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","1"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"",0,"","aco","Perfil 5, queimadores simples"],["ff982","industriais","Fogão Perfil 5, 2 bocas, queimadores simples, de mesa","FF982","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","2"],["Versão","De mesa"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"",0,"g-ff006","aco","Perfil 5, queimadores simples"],["ff981","industriais","Fogão Perfil 5, 2 bocas, queimadores simples","FF981","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","2"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff009",0,"g-ff008","aco","Perfil 5, queimadores simples","p5p"],["ff980","industriais","Fogão Perfil 5, 3 bocas, queimadores simples","FF980","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","3"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff101",0,"g-ff029","aco","Perfil 5, queimadores simples","p5p"],["ff979","industriais","Fogão Perfil 5, 4 bocas, queimadores simples","FF979","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","4"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff011",0,"g-ff010","aco","Perfil 5, queimadores simples","p5g"],["ff978","industriais","Fogão Perfil 5, 6 bocas, queimadores simples","FF978","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","6"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff019",0,"g-ff020","aco","Perfil 5, queimadores simples","p5g"],["ff143","industriais","Fogão Perfil 5, 1 boca, queimador duplo, de mesa","FF143","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Versão","De mesa"],["Queimadores","1 duplo"],["Pressão","Baixa"],["L × A × P","39 × 150 × 465 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","3,5 kg"]],"ff143",0,"g-ff143","ferro","Perfil 5, queimadores duplos"],["ff141","industriais","Fogão Perfil 5, 1 boca, queimador duplo","FF141","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","1"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"",0,"g-ff141","ferro","Perfil 5, queimadores duplos"],["ff154","industriais","Fogão Perfil 5, 2 bocas, queimadores duplos, de mesa","FF154","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","2"],["Versão","De mesa"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"",0,"g-ff154","ferro","Perfil 5, queimadores duplos"],["ff130","industriais","Fogão Perfil 5, 2 bocas, queimadores duplos","FF130","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","2"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff009",0,"g-ff130","ferro","Perfil 5, queimadores duplos","p5p"],["ff198","industriais","Fogão Perfil 5, 3 bocas, queimadores duplos","FF198","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","3"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff101",0,"g-ff198","ferro","Perfil 5, queimadores duplos","p5p"],["ff199","industriais","Fogão Perfil 5, 4 bocas, queimadores duplos","FF199","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","4"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff011",0,"g-ff199","ferro","Perfil 5, queimadores duplos","p5g"],["ff200","industriais","Fogão Perfil 5, 6 bocas, queimadores duplos","FF200","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","6"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff019",0,"g-ff200","ferro","Perfil 5, queimadores duplos","p5g"],["ff971","industriais","Fogão Perfil 5, 1 boca, queimador duplo, de mesa","FF971","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","1"],["Versão","De mesa"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff143",0,"g-ff143","aco","Perfil 5, queimadores duplos"],["ff970","industriais","Fogão Perfil 5, 1 boca, queimador duplo","FF970","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","1"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"",0,"g-ff141","aco","Perfil 5, queimadores duplos"],["ff969","industriais","Fogão Perfil 5, 2 bocas, queimadores duplos, de mesa","FF969","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","2"],["Versão","De mesa"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"",0,"g-ff154","aco","Perfil 5, queimadores duplos"],["ff968","industriais","Fogão Perfil 5, 2 bocas, queimadores duplos","FF968","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","2"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff009",0,"g-ff130","aco","Perfil 5, queimadores duplos","p5p"],["ff967","industriais","Fogão Perfil 5, 3 bocas, queimadores duplos","FF967","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","3"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff101",0,"g-ff198","aco","Perfil 5, queimadores duplos","p5p"],["ff966","industriais","Fogão Perfil 5, 4 bocas, queimadores duplos","FF966","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","4"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff011",0,"g-ff199","aco","Perfil 5, queimadores duplos","p5g"],["ff965","industriais","Fogão Perfil 5, 6 bocas, queimadores duplos","FF965","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","6"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff019",0,"g-ff200","aco","Perfil 5, queimadores duplos","p5g"],["ff007","industriais","Fogão Perfil 5, 2 bocas, queimadores simples e duplos, de mesa","FF007","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","2"],["Versão","De mesa"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"",0,"g-ff007","ferro","Perfil 5, queimadores simples e duplos"],["ff009","industriais","Fogão Perfil 5, 2 bocas, queimadores simples e duplos","FF009","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Queimadores","1 simples e 1 duplo"],["Pressão","Baixa"],["L × A × P","730 × 860 × 465 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","17 kg"]],"ff009",0,"g-ff009","ferro","Perfil 5, queimadores simples e duplos","p5p"],["ff101","industriais","Fogão Perfil 5, 3 bocas, queimadores simples e duplos","FF101","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Queimadores","2 simples e 1 duplo"],["Pressão","Baixa"],["L × A × P","1070 × 860 × 465 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","22 kg"]],"ff101",0,"g-ff101","ferro","Perfil 5, queimadores simples e duplos","p5p"],["ff011","industriais","Fogão Perfil 5, 4 bocas, queimadores simples e duplos","FF011","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Queimadores","2 simples e 2 duplos"],["Pressão","Baixa"],["L × A × P","730 × 860 × 795 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"]],"ff011",0,"g-ff011","ferro","Perfil 5, queimadores simples e duplos","p5g"],["ff170","industriais","Fogão Perfil 5, 4 bocas, queimadores simples e duplos, com chapa","FF170","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","4"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"],["Chapa","Sim"]],"",0,"g-ff170","ferro","Perfil 5, queimadores simples e duplos","p5g"],["ff019","industriais","Fogão Perfil 5, 6 bocas, queimadores simples e duplos","FF019","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Queimadores","3 simples e 3 duplos"],["Pressão","Baixa"],["L × A × P","1070 × 860 × 795 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","38 kg"]],"ff019",0,"g-ff019","ferro","Perfil 5, queimadores simples e duplos","p5g"],["ff202","industriais","Fogão Perfil 5, 6 bocas, queimadores simples e duplos, com chapa","FF202","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","6"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"],["Chapa","Sim"]],"",0,"g-ff202","ferro","Perfil 5, queimadores simples e duplos","p5g"],["ff031","industriais","Fogão Perfil 5, 8 bocas, queimadores simples e duplos","FF031","Aço carbono","#2B2B2B",10,[["Linha","Perfil 5"],["Bocas","8"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"",0,"g-ff031","ferro","Perfil 5, queimadores simples e duplos"],["ff999","industriais","Fogão Perfil 5, 2 bocas, queimadores simples e duplos, de mesa","FF999","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","2"],["Versão","De mesa"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"",0,"g-ff007","aco","Perfil 5, queimadores simples e duplos"],["ff998","industriais","Fogão Perfil 5, 2 bocas, queimadores simples e duplos","FF998","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","2"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff009",0,"g-ff009","aco","Perfil 5, queimadores simples e duplos","p5p"],["ff997","industriais","Fogão Perfil 5, 3 bocas, queimadores simples e duplos","FF997","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","3"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff101",0,"g-ff101","aco","Perfil 5, queimadores simples e duplos","p5p"],["ff996","industriais","Fogão Perfil 5, 4 bocas, queimadores simples e duplos","FF996","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","4"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff011",0,"g-ff011","aco","Perfil 5, queimadores simples e duplos","p5g"],["ff995","industriais","Fogão Perfil 5, 4 bocas, queimadores simples e duplos, com chapa","FF995","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","4"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"],["Chapa","Sim"]],"",0,"g-ff170","aco","Perfil 5, queimadores simples e duplos","p5g"],["ff994","industriais","Fogão Perfil 5, 6 bocas, queimadores simples e duplos","FF994","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","6"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"ff019",0,"g-ff019","aco","Perfil 5, queimadores simples e duplos","p5g"],["ff993","industriais","Fogão Perfil 5, 6 bocas, queimadores simples e duplos, com chapa","FF993","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","6"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"],["Chapa","Sim"]],"",0,"g-ff202","aco","Perfil 5, queimadores simples e duplos","p5g"],["ff992","industriais","Fogão Perfil 5, 8 bocas, queimadores simples e duplos","FF992","Aço carbono","#2B2B2B",9,[["Linha","Perfil 5"],["Bocas","8"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Aço carbono 30×30"]],"",0,"g-ff031","aco","Perfil 5, queimadores simples e duplos"],["ff124","industriais","Fogão Perfil 7, 1 boca, queimador simples","FF124","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Bocas","1"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, queimadores simples"],["ff146","industriais","Fogão Perfil 7, 2 bocas, queimadores simples","FF146","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Bocas","2"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff100",0,"","ferro","Perfil 7, queimadores simples","p7p"],["ff132","industriais","Fogão Perfil 7, 4 bocas, queimadores simples","FF132","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Bocas","4"],["Queimadores","Simples"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff109",0,"","ferro","Perfil 7, queimadores simples","p7g"],["ff147","industriais","Fogão Perfil 7, 1 boca, queimador duplo, de mesa","FF147","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Versão","De mesa"],["Queimadores","1 duplo"],["Pressão","Baixa"],["L × A × P","395 × 155 × 475 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","4,5 kg"]],"ff147",0,"","ferro","Perfil 7, queimadores duplos"],["ff119","industriais","Fogão Perfil 7, 1 boca, queimador duplo","FF119","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Bocas","1"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, queimadores duplos"],["ff133","industriais","Fogão Perfil 7, 2 bocas, queimadores duplos","FF133","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Bocas","2"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff100",0,"","ferro","Perfil 7, queimadores duplos","p7p"],["ff128","industriais","Fogão Perfil 7, 3 bocas, queimadores duplos","FF128","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Bocas","3"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff107",0,"","ferro","Perfil 7, queimadores duplos","p7p"],["ff131","industriais","Fogão Perfil 7, 4 bocas, queimadores duplos","FF131","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Bocas","4"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff109",0,"","ferro","Perfil 7, queimadores duplos","p7g"],["ff126","industriais","Fogão Perfil 7, 6 bocas, queimadores duplos","FF126","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Bocas","6"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"ff114",0,"","ferro","Perfil 7, queimadores duplos","p7g"],["ff153","industriais","Fogão Perfil 7, 8 bocas, queimadores duplos","FF153","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Bocas","8"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, queimadores duplos"],["ff105","industriais","Fogão Perfil 7, 2 bocas, queimadores simples e duplos","FF105","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Queimadores","1 simples e 1 duplo"],["Pressão","Baixa"],["L × A × P","785 × 860 × 480 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","18 kg"]],"ff100",0,"","ferro","Perfil 7, queimadores simples e duplos","p7p"],["ff107","industriais","Fogão Perfil 7, 3 bocas, queimadores simples e duplos","FF107","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Queimadores","2 simples e 1 duplo"],["Pressão","Baixa"],["L × A × P","1140 × 860 × 480 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"]],"ff107",0,"","ferro","Perfil 7, queimadores simples e duplos","p7p"],["ff109","industriais","Fogão Perfil 7, 4 bocas, queimadores simples e duplos","FF109","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Queimadores","2 simples e 2 duplos"],["Pressão","Baixa"],["L × A × P","785 × 860 × 830 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","26 kg"]],"ff109",0,"","ferro","Perfil 7, queimadores simples e duplos","p7g"],["ff111","industriais","Fogão Perfil 7, 4 bocas, queimadores simples e duplos, com chapa","FF111","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Queimadores","2 simples e 2 duplos"],["Pressão","Baixa"],["L × A × P","1140 × 860 × 830 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","43 kg"]],"ff111",0,"","ferro","Perfil 7, queimadores simples e duplos","p7g"],["ff114","industriais","Fogão Perfil 7, 6 bocas, queimadores simples e duplos","FF114","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Queimadores","3 simples e 3 duplos"],["Pressão","Baixa"],["L × A × P","1140 × 860 × 830 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","41 kg"]],"ff114",0,"","ferro","Perfil 7, queimadores simples e duplos","p7g"],["ff116","industriais","Fogão Perfil 7, 6 bocas, queimadores simples e duplos, com chapa","FF116","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Queimadores","3 simples e 3 duplos"],["Pressão","Baixa"],["L × A × P","1500 × 860 × 830 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","50 kg"]],"ff116",0,"","ferro","Perfil 7, queimadores simples e duplos","p7g"],["ff168","industriais","Fogão Perfil 7, 8 bocas, queimadores simples e duplos","FF168","Aço carbono","#2B2B2B",11,[["Linha","Perfil 7"],["Bocas","8"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, queimadores simples e duplos"],["ff503","industriais","Fogão Perfil 8, 2 bocas 40×40, queimadores duplos","FF503","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","2"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, queimadores duplos"],["p8-3b-qd","industriais","Fogão Perfil 8, 3 bocas 40×40, queimadores duplos","","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","3"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, queimadores duplos"],["ff527","industriais","Fogão Perfil 8, 4 bocas 40×40, queimadores duplos","FF527","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","4"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, queimadores duplos"],["ff545","industriais","Fogão Perfil 8, 6 bocas 40×40, queimadores duplos","FF545","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","6"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, queimadores duplos"],["p8-8b-qd","industriais","Fogão Perfil 8, 8 bocas 40×40, queimadores duplos","","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","8"],["Queimadores","Duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, queimadores duplos"],["ff506","industriais","Fogão Perfil 8, 2 bocas 40×40, queimadores simples e duplos","FF506","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","2"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, queimadores simples e duplos"],["ff514","industriais","Fogão Perfil 8, 3 bocas 40×40, queimadores simples e duplos","FF514","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","3"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, queimadores simples e duplos"],["ff520","industriais","Fogão Perfil 8, 4 bocas 40×40, queimadores simples e duplos","FF520","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","4"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, queimadores simples e duplos"],["ff540","industriais","Fogão Perfil 8, 6 bocas 40×40, queimadores simples e duplos","FF540","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","6"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, queimadores simples e duplos"],["ff543","industriais","Fogão Perfil 8, 8 bocas 40×40, queimadores simples e duplos","FF543","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","8"],["Queimadores","Simples e duplos"],["Pressão","Baixa"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, queimadores simples e duplos"],["fog6inox","industriais","Fogão inox 6 bocas com forno","","Inox","#9AA0A6",-1,[["Linha","Perfil 5"],["Queimadores","3 simples e 3 duplos"],["L × A × P","1070 × 860 × 795 mm"],["Corpo","Inox"],["Forno","Inox"],["Forno interno","300 × 480 × 580 mm"],["Peso","65 kg"]],"fog6inox",0,"","","Inox"],["fog2inox","industriais","Fogão inox 2 bocas com forno","","Inox","#9AA0A6",-1,[["Linha","Perfil 7"],["Queimadores","2 duplos"],["L × A × P","785 × 860 × 480 mm"],["Corpo","Inox"],["Forno","Inox"],["Forno interno","Inox 30×30"],["Peso","18 kg sem forno"]],"fog2inox",0,"","","Inox"],["ff001","altapressao","Fogão alta pressão Perfil 5, 1 boca 20×20, de mesa","FF001","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","1"],["Versão","De mesa"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 20×20"]],"",0,"","ferro","Perfil 5, grelha 20×20"],["ap-p5-1b-2020","altapressao","Fogão alta pressão Perfil 5, 1 boca 20×20","","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","1"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 20×20"]],"",0,"","ferro","Perfil 5, grelha 20×20"],["ff002","altapressao","Fogão alta pressão Perfil 5, 2 bocas 20×20, de mesa","FF002","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","2"],["Versão","De mesa"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 20×20"]],"",0,"","ferro","Perfil 5, grelha 20×20"],["ff004","altapressao","Fogão alta pressão Perfil 5, 2 bocas 20×20","FF004","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","2"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 20×20"]],"",0,"","ferro","Perfil 5, grelha 20×20"],["ff017","altapressao","Fogão alta pressão Perfil 5, 2 bocas 20×20, especial","FF017","Aço carbono","#2B2B2B",14,[["Linha","Alta pressão"],["Queimadores","Alta pressão"],["L × A × P","650 × 820 × 480 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 20×20"],["Pintura","Eletrostática"],["Peso","12 kg"]],"ff017",0,"","ferro","Perfil 5, grelha 20×20"],["ff103","altapressao","Fogão alta pressão Perfil 5, 1 boca 30×30, de mesa","FF103","Aço carbono","#2B2B2B",14,[["Linha","Alta pressão"],["Versão","De mesa"],["Queimadores","Alta pressão"],["L × A × P","390 × 150 × 465 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","3 kg"]],"ff103",0,"g-ff103","ferro","Perfil 5, grelha 30×30"],["ff140","altapressao","Fogão alta pressão Perfil 5, 1 boca 30×30","FF140","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","1"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"g-ff140","ferro","Perfil 5, grelha 30×30"],["ff104","altapressao","Fogão alta pressão Perfil 5, 2 bocas 30×30, de mesa","FF104","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","2"],["Versão","De mesa"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"g-ff104","ferro","Perfil 5, grelha 30×30"],["ff014","altapressao","Fogão alta pressão Perfil 5, 2 bocas 30×30","FF014","Aço carbono","#2B2B2B",14,[["Linha","Alta pressão"],["Queimadores","Alta pressão"],["L × A × P","730 × 860 × 465 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","17 kg"]],"ff014",0,"g-ff014","ferro","Perfil 5, grelha 30×30"],["ff015","altapressao","Fogão alta pressão Perfil 5, 3 bocas 30×30","FF015","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","3"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"g-ff015","ferro","Perfil 5, grelha 30×30"],["ff016","altapressao","Fogão alta pressão Perfil 5, 4 bocas 30×30","FF016","Aço carbono","#2B2B2B",14,[["Linha","Alta pressão"],["Queimadores","Alta pressão"],["L × A × P","730 × 860 × 465 mm"],["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],["Peso","24,5 kg"]],"ff016",0,"g-ff016","ferro","Perfil 5, grelha 30×30"],["ff018","altapressao","Fogão alta pressão Perfil 5, 6 bocas 30×30","FF018","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","6"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"g-ff018","ferro","Perfil 5, grelha 30×30"],["ff024","altapressao","Fogão alta pressão Perfil 5, 8 bocas 30×30","FF024","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","8"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"g-ff024","ferro","Perfil 5, grelha 30×30"],["ff958","altapressao","Fogão alta pressão Perfil 5, 1 boca 30×30, de mesa","FF958","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","1"],["Versão","De mesa"],["Queimadores","Alta pressão"],["Grelha","Aço carbono 30×30"]],"ff103",0,"g-ff103","aco","Perfil 5, grelha 30×30"],["ff957","altapressao","Fogão alta pressão Perfil 5, 1 boca 30×30","FF957","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","1"],["Queimadores","Alta pressão"],["Grelha","Aço carbono 30×30"]],"",0,"g-ff140","aco","Perfil 5, grelha 30×30"],["ff956","altapressao","Fogão alta pressão Perfil 5, 2 bocas 30×30, de mesa","FF956","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","2"],["Versão","De mesa"],["Queimadores","Alta pressão"],["Grelha","Aço carbono 30×30"]],"",0,"g-ff104","aco","Perfil 5, grelha 30×30"],["ff955","altapressao","Fogão alta pressão Perfil 5, 2 bocas 30×30","FF955","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","2"],["Queimadores","Alta pressão"],["Grelha","Aço carbono 30×30"]],"ff014",0,"g-ff014","aco","Perfil 5, grelha 30×30"],["ff954","altapressao","Fogão alta pressão Perfil 5, 3 bocas 30×30","FF954","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","3"],["Queimadores","Alta pressão"],["Grelha","Aço carbono 30×30"]],"",0,"g-ff015","aco","Perfil 5, grelha 30×30"],["ff953","altapressao","Fogão alta pressão Perfil 5, 4 bocas 30×30","FF953","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","4"],["Queimadores","Alta pressão"],["Grelha","Aço carbono 30×30"]],"ff016",0,"g-ff016","aco","Perfil 5, grelha 30×30"],["ff952","altapressao","Fogão alta pressão Perfil 5, 6 bocas 30×30","FF952","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","6"],["Queimadores","Alta pressão"],["Grelha","Aço carbono 30×30"]],"",0,"g-ff018","aco","Perfil 5, grelha 30×30"],["ff951","altapressao","Fogão alta pressão Perfil 5, 8 bocas 30×30","FF951","Aço carbono","#2B2B2B",14,[["Linha","Perfil 5"],["Bocas","8"],["Queimadores","Alta pressão"],["Grelha","Aço carbono 30×30"]],"",0,"g-ff024","aco","Perfil 5, grelha 30×30"],["ff134","altapressao","Fogão alta pressão Perfil 7, 1 boca 30×30, de mesa","FF134","Aço carbono","#2B2B2B",14,[["Linha","Perfil 7"],["Bocas","1"],["Versão","De mesa"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, grelha 30×30"],["ff161","altapressao","Fogão alta pressão Perfil 7, 1 boca 30×30","FF161","Aço carbono","#2B2B2B",14,[["Linha","Perfil 7"],["Bocas","1"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, grelha 30×30"],["ff135","altapressao","Fogão alta pressão Perfil 7, 2 bocas 30×30, de mesa","FF135","Aço carbono","#2B2B2B",14,[["Linha","Perfil 7"],["Bocas","2"],["Versão","De mesa"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, grelha 30×30"],["ff122","altapressao","Fogão alta pressão Perfil 7, 2 bocas 30×30","FF122","Aço carbono","#2B2B2B",14,[["Linha","Perfil 7"],["Bocas","2"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, grelha 30×30"],["ff127","altapressao","Fogão alta pressão Perfil 7, 3 bocas 30×30","FF127","Aço carbono","#2B2B2B",14,[["Linha","Perfil 7"],["Bocas","3"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, grelha 30×30"],["ff121","altapressao","Fogão alta pressão Perfil 7, 4 bocas 30×30","FF121","Aço carbono","#2B2B2B",14,[["Linha","Perfil 7"],["Bocas","4"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, grelha 30×30"],["ff201","altapressao","Fogão alta pressão Perfil 7, 4 bocas 30×30, com chapa","FF201","Aço carbono","#2B2B2B",14,[["Linha","Perfil 7"],["Bocas","4"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"],["Chapa","Sim"]],"",0,"","ferro","Perfil 7, grelha 30×30"],["ff125","altapressao","Fogão alta pressão Perfil 7, 6 bocas 30×30","FF125","Aço carbono","#2B2B2B",14,[["Linha","Perfil 7"],["Bocas","6"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 30×30"]],"",0,"","ferro","Perfil 7, grelha 30×30"],["ff511","altapressao","Fogão alta pressão Perfil 8, 3 bocas 40×40","FF511","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","3"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, grelha 40×40"],["ff546","altapressao","Fogão alta pressão Perfil 8, 4 bocas 40×40","FF546","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","4"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, grelha 40×40"],["ff529","altapressao","Fogão alta pressão Perfil 8, 6 bocas 40×40","FF529","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","6"],["Queimadores","Alta pressão"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, grelha 40×40"],["ap-p8-4b-qsqd","altapressao","Fogão alta pressão Perfil 8, 4 bocas 40×40, queimadores simples e duplos","","Aço carbono","#2B2B2B",-1,[["Linha","Perfil 8"],["Bocas","4"],["Queimadores","Alta pressão, simples e duplos"],["Grelha","Ferro fundido 40×40"]],"",0,"","ferro","Perfil 8, grelha 40×40"],["cmp-carbono","camping","Fogão camping aço carbono","F01BAMP","Aço carbono","#2B2B2B",5,[["Queimadores","Alta pressão"],["L × A × P","27 × 13 × 27"],["Corpo","Reforçado"],["Grelha","Aço carbono"],["Pintura","Eletrostática"],["Peso","1,320 kg"]],"cmp-carbono",0,"","",""],["cmp-inox","camping","Fogão camping inox","F01BCAMINOX","Inox","#9AA0A6",5,[["Queimadores","Alta pressão"],["L × A × P","27 × 13 × 27"],["Corpo","Reforçado"],["Grelha","Aço carbono"],["Pintura","Eletrostática"],["Peso","1,320 kg"]],"cmp-inox",0,"","",""],["cmp-vermelho","camping","Fogão camping vermelho","F01BCAMPV","Vermelho","#E3262E",5,[["Queimadores","Alta pressão"],["L × A × P","27 × 13 × 27"],["Corpo","Reforçado"],["Grelha","Aço carbono"],["Pintura","Eletrostática"],["Peso","1,320 kg"]],"cmp-vermelho",0,"","",""],["cmp-azul","camping","Fogão camping azul Itatiaia","F01BCAMPA","Azul Itatiaia","#4FC3E8",5,[["Queimadores","Alta pressão"],["L × A × P","27 × 13 × 27"],["Corpo","Reforçado"],["Grelha","Aço carbono"],["Pintura","Eletrostática"],["Peso","1,320 kg"]],"cmp-azul",0,"","",""],["ff152ti","fornos","Forno cavalete 86 litros, tampa de inox","FF152TI","Aço carbono","#2B2B2B",-1,[["Capacidade","86 litros"],["Tampa","Tampa de inox"]],"",0,"","",""],["ff152tv","fornos","Forno cavalete 86 litros, tampa de vidro","FF152TV","Aço carbono","#2B2B2B",-1,[["Capacidade","86 litros"],["Tampa","Tampa de vidro"]],"",0,"","",""],["ff022","fornos","Forno cavalete 115 litros, tampa de inox","FF022TI","Aço carbono","#2B2B2B",-1,[["Capacidade","115 litros"],["Tampa","Tampa de inox"],["Medida externa L × A × P","580 × 1190 × 930 mm"],["Medida interna L × A × P","480 × 300 × 800 mm"],["Porta","Aço inox"],["Corpo","Aço carbono"],["Pintura","Eletrostática"],["Peso","31 kg"]],"ff022",0,"","",""],["ff022tv","fornos","Forno cavalete 115 litros, tampa de vidro","FF022TV","Aço carbono","#2B2B2B",-1,[["Capacidade","115 litros"],["Tampa","Tampa de vidro"],["Medida externa L × A × P","580 × 1190 × 930 mm"],["Medida interna L × A × P","480 × 300 × 800 mm"],["Porta","Aço inox"],["Corpo","Aço carbono"],["Pintura","Eletrostática"],["Peso","31 kg"]],"ff022tv",0,"","",""],["ff162","fornosavulsos","Forno avulso pequeno, tampa pintada (Perfil 5)","FF162","Aço carbono","#2B2B2B",-1,[["Tamanho","Pequeno"],["Tampa","Pintada"],["Para fogões","Perfil 5"]],"",0,"","",""],["ff162ti","fornosavulsos","Forno avulso pequeno, tampa de inox (Perfil 5)","FF162TI","Aço carbono","#2B2B2B",-1,[["Tamanho","Pequeno"],["Tampa","Inox"],["Para fogões","Perfil 5"]],"",0,"","",""],["ff162tv","fornosavulsos","Forno avulso pequeno, tampa de vidro (Perfil 5)","FF162TV","Aço carbono","#2B2B2B",-1,[["Tamanho","Pequeno"],["Tampa","Vidro"],["Para fogões","Perfil 5"]],"",0,"","",""],["ff164","fornosavulsos","Forno avulso pequeno, tampa de inox (Perfil 7)","FF164","Aço carbono","#2B2B2B",-1,[["Tamanho","Pequeno"],["Tampa","Inox"],["Para fogões","Perfil 7"]],"",0,"","",""],["ff164tv","fornosavulsos","Forno avulso pequeno, tampa de vidro (Perfil 7)","FF164TV","Aço carbono","#2B2B2B",-1,[["Tamanho","Pequeno"],["Tampa","Vidro"],["Para fogões","Perfil 7"],["Observação","Para fogões de 2 e 3 bocas"]],"",0,"","",""],["ff163","fornosavulsos","Forno avulso grande, tampa pintada (Perfil 5)","FF163","Aço carbono","#2B2B2B",-1,[["Tamanho","Grande"],["Tampa","Pintada"],["Para fogões","Perfil 5"]],"",0,"","",""],["ff163ti","fornosavulsos","Forno avulso grande, tampa de inox (Perfil 5)","FF163TI","Aço carbono","#2B2B2B",-1,[["Tamanho","Grande"],["Tampa","Inox"],["Para fogões","Perfil 5"],["Observação","220°"]],"",0,"","",""],["ff163tv","fornosavulsos","Forno avulso grande, tampa de vidro (Perfil 5)","FF163TV","Aço carbono","#2B2B2B",-1,[["Tamanho","Grande"],["Tampa","Vidro"],["Para fogões","Perfil 5"]],"",0,"","",""],["ff163tv-i","fornosavulsos","Forno avulso grande em inox, tampa de vidro (Perfil 5)","FF163TV-I","Aço carbono","#2B2B2B",-1,[["Tamanho","Grande"],["Tampa","Vidro"],["Para fogões","Perfil 5"],["Observação","Em inox"]],"",0,"","",""],["ff165","fornosavulsos","Forno avulso grande, tampa pintada (Perfil 7)","FF165","Aço carbono","#2B2B2B",-1,[["Tamanho","Grande"],["Tampa","Pintada"],["Para fogões","Perfil 7"],["Observação","Com lã de vidro"]],"",0,"","",""],["ff165tv","fornosavulsos","Forno avulso grande, tampa de vidro (Perfil 7)","FF165TV","Aço carbono","#2B2B2B",-1,[["Tamanho","Grande"],["Tampa","Vidro"],["Para fogões","Perfil 7"],["Observação","250°"]],"",0,"","",""],["tacho-14","tacho","Tacho fritador nº 14","","Aço carbono","#2B2B2B",-1,[["Número","14"]],"",0,"","",""],["tacho-16","tacho","Tacho fritador nº 16","","Aço carbono","#2B2B2B",-1,[["Número","16"]],"",0,"","",""],["frit-6","tacho","Fritador a gás em aço carbono, nº 14, 6 litros","FRIT-6","Aço carbono","#2B2B2B",-1,[["Material","Aço carbono"],["Tacho","Nº 14"],["Capacidade","6 litros"],["Acompanha","Tacho e suporte"]],"",0,"","",""],["frit-6i","tacho","Fritador a gás em aço inox, nº 14, 6 litros","FRIT-6I","Inox","#9AA0A6",-1,[["Material","Aço inox"],["Tacho","Nº 14"],["Capacidade","6 litros"],["Acompanha","Tacho e suporte"]],"",0,"","",""],["frit40","tacho","Tacho fritador a gás","FRIT-40","Inox","#9AA0A6",6,[["Queimadores","Alta pressão, em caulim de 120 mm"],["A × L × P","90 × 45 × 50 cm"],["Corpo","Aço inox"],["Tacho","Aço carbono esmaltado"],["Peso bruto","9 kg"],["Acompanha","Mangueira e válvula de alta pressão"]],"frit40",0,"","",""],["snd-4040sndp","sanduicheiras","Sanduicheira 40 cm com prensa","4040SNDP","Aço inox","#9AA0A6",2,[["A × L × P","43 × 13 × 45 cm"],["Corpo","Aço inox"],["Chapa","Aço 1/8 × 3,10 mm"],["Prensa","Aço carbono, com puxador em madeira"],["Peso","11 kg"]],"snd-4040sndp",0,"","",""],["snd-4060sndp","sanduicheiras","Sanduicheira 60 cm com prensa","4060SNDP","Aço inox","#9AA0A6",2,[["A × L × P","63 × 13 × 45 cm"],["Corpo","Aço inox"],["Chapa","Aço 1/8 × 3,10 mm"],["Prensa","Aço carbono, com puxador em madeira"],["Peso","13 kg"]],"snd-4060sndp",0,"","",""],["snd-4080sndp","sanduicheiras","Sanduicheira 80 cm com prensa","4080SNDP","Aço inox","#9AA0A6",2,[["A × L × P","83 × 13 × 45 cm"],["Corpo","Aço inox"],["Chapa","Aço 1/8 × 3,10 mm"],["Prensa","Aço carbono, com puxador em madeira"],["Peso","15 kg"]],"snd-4080sndp",0,"","",""],["snd-4040snd","sanduicheiras","Sanduicheira 40 cm sem prensa","4040SND","Aço inox","#9AA0A6",2,[["A × L × P","43 × 10 × 45 cm"],["Corpo","Aço inox"],["Chapa","Aço 1/8 × 3,10 mm"],["Prensa","Não acompanha"],["Peso","7 kg"]],"snd-4040snd",0,"","",""],["snd-4060snd","sanduicheiras","Sanduicheira 60 cm sem prensa","4060SND","Aço inox","#9AA0A6",2,[["A × L × P","63 × 10 × 45 cm"],["Corpo","Aço inox"],["Chapa","Aço 1/8 × 3,10 mm"],["Prensa","Não acompanha"],["Peso","9 kg"]],"snd-4060snd",0,"","",""],["snd-4080snd","sanduicheiras","Sanduicheira 80 cm sem prensa","4080SND","Aço inox","#9AA0A6",2,[["A × L × P","83 × 10 × 45 cm"],["Corpo","Aço inox"],["Chapa","Aço 1/8 × 3,10 mm"],["Prensa","Não acompanha"],["Peso","11 kg"]],"snd-4080snd",0,"","",""],["chp-4550cl","chapeiras","Chapa bifeteira Classic 450","4550CL","Aço inox","#9AA0A6",1,[["L × A × P","45,5 × 24 × 52 cm"],["Corpo","Aço inox"],["Chapa","Aço 3/16 × 4,76 mm"],["Peso","16 kg"]],"chp-4550cl",0,"","",""],["chp-6550cl","chapeiras","Chapa bifeteira Classic 650","6550CL","Aço inox","#9AA0A6",1,[["L × A × P","65,5 × 24 × 52 cm"],["Corpo","Aço inox"],["Chapa","Aço 3/16 × 4,76 mm"],["Peso","21 kg"]],"chp-6550cl",0,"","",""],["chp-8550cl","chapeiras","Chapa bifeteira Classic 850","8550CL","Aço inox","#9AA0A6",1,[["L × A × P","85 × 24 × 52 cm"],["Corpo","Aço inox"],["Chapa","Aço 3/16 × 4,76 mm"],["Peso","26 kg"]],"chp-8550cl",0,"","",""],["chp-1050cl","chapeiras","Chapa bifeteira Classic 1050","1050CL","Aço inox","#9AA0A6",1,[["L × A × P","105,5 × 24 × 52 cm"],["Corpo","Aço inox"],["Chapa","Aço 1/4 × 6,3 mm"],["Peso","33 kg"]],"chp-1050cl",0,"","",""],["chp-1250cl","chapeiras","Chapa bifeteira Classic 1250","1250CL","Aço inox","#9AA0A6",1,[["L × A × P","125,5 × 24 × 52 cm"],["Corpo","Aço inox"],["Chapa","Aço 1/4 × 6,3 mm"],["Peso","48 kg"]],"chp-1250cl",0,"","",""],["dsc-fd001","disco","Disco de arado 30 cm","FD001","Aço carbono","#2B2B2B",8,[["Cabo","Madeira"],["Disco","Aço carbono"],["Espessura do disco","2 mm"],["Tamanho do disco","30 cm"],["Disco e cabo","60 cm"]],"dsc-fd001",0,"","",""],["dsc-fd002","disco","Disco de arado 36 cm","FD002","Aço carbono","#2B2B2B",8,[["Cabo","Madeira"],["Disco","Aço carbono"],["Espessura do disco","2 mm"],["Tamanho do disco","36 cm"],["Disco e cabo","60 cm"]],"dsc-fd002",0,"","",""],["dsc-fd0040","disco","Disco de arado 40 cm","FD004","Aço carbono","#2B2B2B",8,[["Cabo","Madeira"],["Disco","Aço carbono"],["Espessura do disco","2 mm"],["Tamanho do disco","40 cm"],["Disco e cabo","60 cm"]],"dsc-fd0040",0,"","",""],["dsc-fd003","disco","Disco de arado 47 cm","FD003","Aço carbono","#2B2B2B",8,[["Cabo","Madeira"],["Disco","Aço carbono"],["Espessura do disco","2 mm"],["Tamanho do disco","47 cm"],["Disco e cabo","60 cm"]],"dsc-fd003",0,"","",""],["pic-fp001","picadores","Picador de legumes pequeno","FP001","Preto craqueado","#2B2B2B",13,[["Uso","Residencial"],["Corpo","Alumínio fundido"],["Cabo","Alumínio fundido"],["Basculante","Alumínio fundido"],["Pintura","Eletrostática (preto craqueado)"],["Colunas","Tubo de aço 5/8"],["Facas","Aço inox, padrão 10 mm"],["Fixação","Pés em tubo de aço 1/2"],["A × L × P","39 × 18 × 27,5 cm"],["Peso líquido","0,955 kg"]],"pic-fp001",0,"","",""],["pic-fp002","picadores","Picador de legumes médio","FP002","Preto craqueado","#2B2B2B",13,[["Uso","Comercial"],["Corpo","Alumínio fundido"],["Cabo","Alumínio fundido"],["Basculante","Alumínio fundido"],["Pintura","Eletrostática (preto craqueado)"],["Colunas","Tubo de aço 5/8"],["Facas","Aço inox, padrão 10 mm"],["Fixação","Pés em tubo de aço 1/2"],["A × L × P","51 × 29 × 38 cm"],["Peso líquido","1,975 kg"]],"pic-fp002",0,"","",""],["pic-fp003","picadores","Picador de legumes grande","FP003","Preto craqueado","#2B2B2B",13,[["Uso","Comercial"],["Corpo","Alumínio fundido"],["Cabo","Alumínio fundido"],["Basculante","Alumínio fundido"],["Pintura","Eletrostática (preto craqueado)"],["Colunas","Tubo de aço 5/8"],["Facas","Aço inox, padrão 10 mm"],["Fixação","Tripé soldado em tubo de aço 5/8"],["A × L × P","1,14 × 32 × 47 cm"],["Peso líquido","3,400 kg"]],"pic-fp003",0,"","",""],["eng-p30","engenho","Engenho com 2 rolos","P-30","Azul","#27356B",4,[["A × L × P","28 × 25 × 25 cm"],["Peso","5,120 kg"],["Material","Moenda em alumínio, lateral em chapa de aço, engrenagem em ferro fundido"]],"eng-p30",0,"","",""],["eng-p60","engenho","Engenho com 3 rolos","P-60","Azul","#27356B",4,[["A × L × P","25 × 25 × 28 cm"],["Peso","9,010 kg"],["Material","Moenda em alumínio, lateral em chapa de aço, engrenagem em ferro fundido"],["Produção média","40 litros por hora"]],"eng-p60",0,"","",""],["mpi-1360p","mesas","Mesa de panificação com paneleiro MPI 1360P","MPI-1360P","Inox","#9AA0A6",15,[["Tampo","Aço inox 430"],["Estrutura","Aço carbono"],["Pintura","Eletrostática"],["Pés","Emborrachados"],["Paneleiro","Sim"],["Medidas","1300 × 600 × 840 mm"]],"mesa-com",0,"","",""],["mpi-1660p","mesas","Mesa de panificação com paneleiro MPI 1660P","MPI-1660P","Inox","#9AA0A6",15,[["Tampo","Aço inox 430"],["Estrutura","Aço carbono"],["Pintura","Eletrostática"],["Pés","Emborrachados"],["Paneleiro","Sim"],["Medidas","1600 × 600 × 840 mm"]],"mesa-com",0,"","",""],["mpi-1860p","mesas","Mesa de panificação com paneleiro MPI 1860P","MPI-1860P","Inox","#9AA0A6",15,[["Tampo","Aço inox 430"],["Estrutura","Aço carbono"],["Pintura","Eletrostática"],["Pés","Emborrachados"],["Paneleiro","Sim"],["Medidas","1800 × 600 × 840 mm"]],"mesa-com",0,"","",""],["mpi-1360","mesas","Mesa de panificação sem paneleiro MPI 1360","MPI-1360","Inox","#9AA0A6",15,[["Tampo","Aço inox 430"],["Estrutura","Aço carbono"],["Pintura","Eletrostática"],["Pés","Emborrachados"],["Paneleiro","Não"],["Medidas","1300 × 600 × 840 mm"]],"mesa-sem",0,"","",""],["mpi-1660","mesas","Mesa de panificação sem paneleiro MPI 1660","MPI-1660","Inox","#9AA0A6",15,[["Tampo","Aço inox 430"],["Estrutura","Aço carbono"],["Pintura","Eletrostática"],["Pés","Emborrachados"],["Paneleiro","Não"],["Medidas","1600 × 600 × 840 mm"]],"mesa-sem",0,"","",""],["mpi-1860","mesas","Mesa de panificação sem paneleiro MPI 1860","MPI-1860","Inox","#9AA0A6",15,[["Tampo","Aço inox 430"],["Estrutura","Aço carbono"],["Pintura","Eletrostática"],["Pés","Emborrachados"],["Paneleiro","Não"],["Medidas","1800 × 600 × 840 mm"]],"mesa-sem",0,"","",""],["lanca-1m","lanca","Lança-chamas 1 m","LC1M","Preto","#231F20",16,[["Cabo","Plástico ABS"],["Bocal","Zincado"],["Mangueira","1 metro"],["Registro","Fechamento de gás"],["Registros","1"]],"lanca-1m",0,"","",""],["lanca-2m","lanca","Lança-chamas 2 m","LC2M","Preto","#231F20",16,[["Cabo","Plástico ABS"],["Bocal","Zincado"],["Mangueira","2 metros"],["Registro","Fechamento de gás"],["Registros","2"]],"lanca-2m",0,"","",""],["kitap","lanca","Mangueira de alta pressão","KIT-AP","Preto","#231F20",7,[["Tubo interno","PVC flexível"],["Registro","Fechamento de gás"],["Uso","Fogões de alta pressão"]],"kitap",0,"","",""],["bqa-br","banquetas","Banqueta alta branca","BQA33CE-BR","Branco","#F4F4F2",0,[["Altura","95 cm"],["Largura","38 cm"],["Peso","4,200 kg"],["Encosto","Sim"],["Pés","Emborrachados"],["Código na tabela de preços","CBA32EPC"]],"bqa-br",0,"","",""],["bqa-pt","banquetas","Banqueta alta preta","BQA33CE-PT","Preto","#231F20",0,[["Altura","95 cm"],["Largura","38 cm"],["Peso","4,200 kg"],["Encosto","Sim"],["Pés","Emborrachados"],["Código na tabela de preços","CBA32EPC"]],"bqa-pt",0,"","",""],["bqb-pt","banquetas","Banqueta baixa preta","BQB33CE-PT","Preto","#231F20",3,[["Altura","45 cm"],["Largura","30 cm"],["Profundidade","42 cm"],["Assento","Napa"],["Pintura","Eletrostática"],["Pés","Emborrachados"],["Código na tabela de preços","006.01.0001"]],"bqb-pt",0,"","",""],["bqb-br","banquetas","Banqueta baixa branca","BQB33CE-BR","Branco","#F4F4F2",3,[["Altura","45 cm"],["Largura","30 cm"],["Profundidade","42 cm"],["Assento","Napa"],["Pintura","Eletrostática"],["Pés","Emborrachados"],["Código na tabela de preços","006.01.0001"]],"bqb-br",0,"","",""],["cab-br","cabideiros","Cabideiro branco","CAB-01","Branco","#F4F4F2",12,[["Altura","1,5 m"],["Largura","23 cm"],["Material","Aço carbono"]],"cab-br",0,"","",""],["cab-pt","cabideiros","Cabideiro preto","CAB-02","Preto","#231F20",12,[["Altura","1,5 m"],["Largura","23 cm"],["Material","Aço carbono"]],"cab-pt",0,"","",""],["prat-3","prateleiras","Prateleira de 3 bandejas","PRAT-3","Sem cor informada","#9AA0A6",-1,[["Bandejas","3"]],"",0,"","",""],["prat-4","prateleiras","Prateleira de 4 bandejas","","Sem cor informada","#9AA0A6",-1,[["Bandejas","4"]],"",0,"","",""],["prat-5","prateleiras","Prateleira de 5 bandejas","","Sem cor informada","#9AA0A6",-1,[["Bandejas","5"]],"",0,"","",""],["port-pet","portaopet","Portão pet 60 cm","PORT-PET","Sem cor informada","#9AA0A6",-1,[["Folha","60 cm"],["Extensor","20 cm"]],"",0,"","",""]];
const FORNOS_POR = {"p5p":["ff162","ff162ti","ff162tv"],"p7p":["ff164","ff164tv"],"p5g":["ff163","ff163ti","ff163tv","ff163tv-i"],"p7g":["ff165","ff165tv"]};
const CATEGORIAS = [["colors","Linha Colors"],["industriais","Fogões baixa pressão"],["altapressao","Fogões alta pressão"],["camping","Fogões camping"],["fornos","Fornos cavalete"],["fornosavulsos","Fornos avulsos"],["tacho","Tachos fritadores"],["sanduicheiras","Sanduicheiras"],["chapeiras","Chapeiras"],["disco","Discos de arado"],["picadores","Picadores de legumes"],["engenho","Engenhos"],["mesas","Mesas de panificação"],["lanca","Lança-chamas e mangueiras"],["banquetas","Banquetas"],["cabideiros","Cabideiros"],["prateleiras","Prateleiras"],["portaopet","Portão pet"]];

const IMG = {"bige": "img/bige.webp", "carlos": "img/carlos.webp", "carlos_hi": "img/carlos_hi.webp", "close_carlos": "img/close_carlos.webp", "close_helena": "img/close_helena.webp", "close_rosa": "img/close_rosa.webp", "cover": "img/cover.webp", "dirce": "img/dirce.webp", "helena": "img/helena.webp", "idalina": "img/idalina.webp", "l_alta": "img/l_alta.webp", "l_banqueta": "img/l_banqueta.webp", "l_chapa": "img/l_chapa.webp", "l_disco": "img/l_disco.webp", "l_engenho": "img/l_engenho.webp", "l_forno": "img/l_forno.webp", "l_forno2": "img/l_forno2.webp", "l_ind5": "img/l_ind5.webp", "l_ind7": "img/l_ind7.webp", "l_inox": "img/l_inox.webp", "l_lanca": "img/l_lanca.webp", "l_mangueira": "img/l_mangueira.webp", "l_mesa": "img/l_mesa.webp", "l_picador": "img/l_picador.webp", "l_sand": "img/l_sand.webp", "l_tacho": "img/l_tacho.webp", "lair": "img/lair.webp", "mateus": "img/mateus.webp", "meire": "img/meire.webp", "rosa": "img/rosa.webp", "zeze": "img/zeze.webp", "zilda": "img/zilda.webp", "zilda_hi": "img/zilda_hi.webp", "c_bqa-br": "img/c_bqa-br.webp", "c_bqa-pt": "img/c_bqa-pt.webp", "c_bqb-br": "img/c_bqb-br.webp", "c_bqb-pt": "img/c_bqb-pt.webp", "c_cab-br": "img/c_cab-br.webp", "c_cab-pt": "img/c_cab-pt.webp", "c_chp-1050cl": "img/c_chp-1050cl.webp", "c_chp-1250cl": "img/c_chp-1250cl.webp", "c_chp-4550cl": "img/c_chp-4550cl.webp", "c_chp-6550cl": "img/c_chp-6550cl.webp", "c_chp-8550cl": "img/c_chp-8550cl.webp", "c_cmp-azul": "img/c_cmp-azul.webp", "c_cmp-carbono": "img/c_cmp-carbono.webp", "c_cmp-inox": "img/c_cmp-inox.webp", "c_cmp-vermelho": "img/c_cmp-vermelho.webp", "c_dsc-fd001": "img/c_dsc-fd001.webp", "c_dsc-fd002": "img/c_dsc-fd002.webp", "c_dsc-fd003": "img/c_dsc-fd003.webp", "c_dsc-fd0040": "img/c_dsc-fd0040.webp", "c_eng-p30": "img/c_eng-p30.webp", "c_eng-p60": "img/c_eng-p60.webp", "c_ff009": "img/c_ff009.webp", "c_ff011": "img/c_ff011.webp", "c_ff014": "img/c_ff014.webp", "c_ff016": "img/c_ff016.webp", "c_ff017": "img/c_ff017.webp", "c_ff019": "img/c_ff019.webp", "c_ff022": "img/c_ff022.webp", "c_ff022tv": "img/c_ff022tv.webp", "c_ff100": "img/c_ff100.webp", "c_ff101": "img/c_ff101.webp", "c_ff103": "img/c_ff103.webp", "c_ff107": "img/c_ff107.webp", "c_ff109": "img/c_ff109.webp", "c_ff111": "img/c_ff111.webp", "c_ff114": "img/c_ff114.webp", "c_ff116": "img/c_ff116.webp", "c_ff143": "img/c_ff143.webp", "c_ff147": "img/c_ff147.webp", "c_fog2inox": "img/c_fog2inox.webp", "c_fog6inox": "img/c_fog6inox.webp", "c_frit40": "img/c_frit40.webp", "c_kitap": "img/c_kitap.webp", "c_lanca-1m": "img/c_lanca-1m.webp", "c_lanca-2m": "img/c_lanca-2m.webp", "c_mesa-com": "img/c_mesa-com.webp", "c_mesa-sem": "img/c_mesa-sem.webp", "c_pic-fp001": "img/c_pic-fp001.webp", "c_pic-fp002": "img/c_pic-fp002.webp", "c_pic-fp003": "img/c_pic-fp003.webp", "c_snd-4040snd": "img/c_snd-4040snd.webp", "c_snd-4040sndp": "img/c_snd-4040sndp.webp", "c_snd-4060snd": "img/c_snd-4060snd.webp", "c_snd-4060sndp": "img/c_snd-4060sndp.webp", "c_snd-4080snd": "img/c_snd-4080snd.webp", "c_snd-4080sndp": "img/c_snd-4080sndp.webp"};      // nome da imagem -> arquivo na pasta img/
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
// Loja do site (consumidor final): preço = tabela JCN + acréscimo definido pela administração (20% de início)
const precoSite = p => { const a = (state.conteudo.loja || {}).acrescimo; if (!(p.preco > 0) || a == null) return p.vit != null ? p.vit : 0;      // visitante: o servidor entrega o preço pronto
  return Math.round(+((Number(p.preco) || 0) * (100 + (a == null ? 20 : Number(a) || 0))).toFixed(4)) / 100; };
const brl = n => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const dataBR = iso => iso ? new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('pt-BR') : '';
const TRANSP = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

/* =====================================================================
   DADOS INICIAIS (catálogo Linha Colors, 2º semestre de 2025)
   No site final estes registros vivem no banco (ver schema.sql).
   ===================================================================== */
const SPEC_COLORS = {
  'Queimadores': '2 bocas simples e 2 duplas', 'L × A × P': '722,7 × 830 × 880,5 mm', 'Corpo': 'Aço carbono',
  'Grelha': 'Ferro fundido 30×30', 'Pintura': 'Eletrostática', 'Forno interno': '580,7 × 670,8 × 450,5 mm', 'Peso': '57 kg'
};
const COLORS = [
  ['mateus', 'Mateus', 'FG4FSDB-LAC', 'Laca Bege', '#F1E7BE', 'Lar doce lar',
    'A vida no campo é simples. Acordar pela manhã, preparar um café com leite, pão e manteiga. À tardezinha, ver o sol se pondo, aconchegar-se na varanda, uma viola a tocar e uma cesta repleta de biscoitos doces passando de mão em mão.\n\nVida boa!'],
  ['zeze', 'Zezé', 'FG4FSD-AMA', 'Amarelo', '#F9AC22', 'Ele não é apenas um fogão',
    'Quando a chama acende, é como se o tempo voltasse — e junto dele, o cheiro doce que vinha da cozinha da avó, as risadas leves, o barulho de passos apressados esperando o bolo ficar pronto.\n\nFeito de lembranças!'],
  ['helena', 'Helena', 'FG4FSD-LRJ', 'Laranja', '#F36421', 'Cuidar de si e de quem se ama!',
    'Tem o espírito de quem vive de portas abertas. O mesmo brilho de um almoço depois da caminhada no parque, de uma conversa sob o sol, do cheirinho leve de legumes grelhando. Ele celebra o prazer de comer bem, de compartilhar receitas simples e saudáveis com quem faz parte da nossa jornada.\n\nFeito para quem cozinha com alma e vive com energia.'],
  ['dirce', 'Dirce', 'FG4FSD-VER', 'Vermelho', '#ED202A', 'Cozinhar também é se apaixonar',
    'Cada chama desperta aquela sensação única do primeiro amor: intensa, viva, impossível de esquecer. Ele transforma o ato de cozinhar em um gesto de paixão, onde o sabor tem alma e o calor tem sentimento.'],
  ['idalina', 'Idalina', 'FG4FSD-PIK', 'Pink', '#CE289C', 'A vida é uma festa',
    'A casa se enche de alegria com as risadas da criançada, o cheiro doce que vem da cozinha e a mesa coberta de guloseimas. As tias ajudam nos preparos, a mãe assa o bolo…\n\nE onde tem brigadeiro, tem festa!'],
  ['rosa', 'Rosa', 'FG4FSD-ROS', 'Rosa Gold', '#B15F65', 'A diva da cozinha',
    'Tem mãos de fada, um toque moderno e um jeito delicado de encantar pelo sabor e pelas cores. Com ela, a casa está sempre cheia de amigos e familiares, cheia de alegria e de boas histórias à mesa.'],
  ['zilda', 'Zilda', 'FG4FSD-AZU', 'Azul Itatiaia', '#4FC3E8', 'O calor que conforta e faz o tempo desacelerar',
    'Traga de volta a leveza dos dias serenos — o riso da família reunida, o cheirinho de café recém-passado, o pão de queijo que chega junto com uma conversa boa em família.\n\nÉ o tipo de calor que não queima, acolhe. Um refúgio entre o sabor e a lembrança.'],
  ['meire', 'Meire', 'FG4FSD-BRA', 'Branco', '#F4F4F2', 'Ele é puro, essencial e eterno',
    'Ele carrega a elegância do que nunca sai de moda. Um clássico que combina com todos os estilos e histórias. Seu design limpo e atemporal traz leveza, harmonia e a sensação de recomeço a cada nova receita.\n\nSimples, mas cheio de presença, ele é o ponto de equilíbrio entre tradição e modernidade.'],
  ['bige', 'Bige', 'FG4FSB-CHU', 'Chumbo', '#425771', 'O coringa do bom gosto',
    'Ele tem aquela presença que harmoniza qualquer espaço — moderno, versátil e atemporal. É a peça que une tudo na cozinha: transmite segurança, maturidade e um toque de elegância que nunca sai de moda.\n\nCom ele, cada refeição ganha um ar de tranquilidade e sofisticação.'],
  ['carlos', 'Carlos', 'FG4FSD-PRE', 'Preto', '#231F20', 'Ele tem presença',
    'Elegante, intenso e cheio de atitude. Seu fogo traduz confiança, seu silêncio impõe respeito. É para quem cozinha com propósito, aprecia o equilíbrio entre força e sofisticação, entre o clássico e o moderno. Discreto, mas impossível de passar despercebido, ele transforma a cozinha em um palco de estilo e essência.'],
  ['lair', 'Lair', 'FG4FSD-VRD', 'Verde', '#75876F', 'Ele tem alma forte e espírito contemporâneo',
    'É o equilíbrio entre natureza e aço, entre o rústico e o moderno. Feito para quem encontra beleza na autenticidade e força nos detalhes. Na cozinha, impõe presença sem precisar dizer uma palavra.']
];

/* Outras linhas (catálogo geral): [id, categoria, nome curto, título, texto, 3 fatos, fotos, produto de bancada] */
const LINHAS = [
  ['ind5', 'industriais', 'Perfil 5', 'Fogões industriais Perfil 5',
    'Para pequenos estabelecimentos ou residências: aço carbono, grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. De 1 a 8 bocas, em baixa ou alta pressão.',
    [['Bocas', '1, 2, 3, 4, 6 e 8'], ['Grelha 30×30', 'ferro fundido ou aço carbono'], ['Forno', 'vendido à parte']], ['img:l_ind5'], false],
  ['ind7', 'industriais', 'Perfil 7', 'Fogões industriais Perfil 7',
    'Para grandes estabelecimentos, com a mesma construção em aço carbono e grelhas 30×30 de ferro fundido. De 1 a 8 bocas, em baixa ou alta pressão, com fornos em aço carbono.',
    [['Bocas', '1, 2, 3, 4, 6 e 8'], ['Grelha 30×30', 'ferro fundido'], ['Forno', 'vendido à parte']], ['img:l_ind7'], false],
  ['inox', 'industriais', 'Inox', 'Fogões em inox',
    'A linha industrial também sai em aço inox, no corpo e no forno, com bocas simples e duplas.',
    [['Na foto', '6 bocas com forno'], ['L × A × P', '1070 × 860 × 795 mm'], ['Peso', '65 kg']], ['img:l_inox'], false],
  ['alta', 'altapressao', 'Alta pressão', 'Fogões de alta pressão',
    'Retomada rápida para alimentos que precisam manter a temperatura. Modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática.',
    [['Grelhas', '20×20, 30×30 e 40×40'], ['Bocas', 'de 1 a 8'], ['Na foto', '4 bocas 30×30, FF016']], ['img:l_alta'], false],
  ['camping', 'camping', 'Camping', 'Fogões camping',
    'Fogão de mesa a gás com queimador de alta pressão, para caminhoneiros que precisam de praticidade na estrada e para quem gosta de acampar e cozinhar ao ar livre. Robusto, econômico e fácil de instalar.',
    [['Versões', 'aço carbono, inox, vermelho e azul Itatiaia'], ['Queimador', 'alta pressão'], ['Peso', '1,32 kg']], ['img:c_cmp-vermelho', 'img:c_cmp-azul'], true],
  ['chapa', 'chapeiras', 'Chapeiras', 'Chapeiras',
    'Para bares e lanchonetes prepararem lanches e porções quentes a gás. Estrutura em aço inox escovado, fácil de limpar, e chapa inteiriça de aço carbono SAE 1020, que retém o calor para selar bem a carne.',
    [['Modelos', 'Classic 450, 650, 850, 1050 e 1250'], ['Largura', 'de 45,5 a 125,5 cm'], ['Peso', 'de 16 a 48 kg']], ['img:l_chapa'], true],
  ['sand', 'sanduicheiras', 'Sanduicheiras', 'Sanduicheiras',
    'Para sanduíches quentes a gás. Prensa em aço carbono, que dá mais temperatura e qualidade ao alimento, corpo em aço inox, bandeja coletora de gordura e bordas sem emendas.',
    [['Modelos', '40, 60 e 80 cm, com ou sem prensa'], ['Chapa', 'aço 1/8 × 3,10 mm'], ['Peso', 'de 7 a 15 kg']], ['img:l_sand'], true],
  ['forno', 'fornos', 'Fornos', 'Fornos cavalete',
    'Forno de 115 litros sobre cavalete, em aço carbono com pintura eletrostática. Porta de vidro ou de inox.',
    [['Modelos', 'FF022TV e FF022'], ['L × A × P', '580 × 1190 × 930 mm'], ['Peso', '31 kg']], ['img:l_forno', 'img:l_forno2'], false],
  ['tacho', 'tacho', 'Tacho', 'Tacho fritador a gás',
    'Seis litros para frituras rápidas e uniformes. Queimador de alta pressão em caulim de 120 mm e tacho em aço carbono esmaltado.',
    [['Modelo', 'FRIT-40'], ['A × L × P', '90 × 45 × 50 cm'], ['Peso bruto', '9 kg']], ['img:l_tacho'], false],
  ['disco', 'disco', 'Discos', 'Discos de arado',
    'Para uma culinária mais rústica: preparo uniforme e sabor caseiro para carnes, legumes e receitas feitas no fogo. Aço carbono de 2 mm, com cabos de madeira.',
    [['Tamanhos', '30, 36, 40 e 47 cm'], ['Espessura', '2 mm'], ['Cabos', 'madeira']], ['img:c_dsc-fd003'], true],
  ['picador', 'picadores', 'Picadores', 'Picadores de legumes',
    'Para batatas em palito e legumes e frutas em palitos ou cubos. Lavável, desmontável e com base antiderrapante, lâmina em aço inox e molas de alta resistência.',
    [['Tamanhos', 'pequeno, médio e grande'], ['Corpo', 'alumínio fundido'], ['Facas', 'aço inox, padrão 10 mm']], ['img:l_picador'], true],
  ['engenho', 'engenho', 'Engenhos', 'Engenhos de cana',
    'Extraem caldo de cana para uso doméstico. Moendas em alumínio, engrenagens em ferro fundido e laterais em chapa de aço. O P60, de 3 rolos, produz em média 40 litros por hora.',
    [['Modelos', 'P30, 2 rolos, e P60, 3 rolos'], ['Peso', '5,1 kg e 9 kg'], ['Produção do P60', '40 litros por hora']], ['img:c_eng-p30', 'img:c_eng-p60'], true],
  ['mesa', 'mesas', 'Mesas', 'Mesas de panificação',
    'Tampo em aço inox, que não contamina os alimentos, não retém odores e é fácil de limpar. Estrutura em aço carbono com pintura eletrostática e pés emborrachados.',
    [['Modelos', 'MPI 1360, 1660 e 1860'], ['Versões', 'com ou sem paneleiro'], ['Tampo', 'aço inox 430']], ['img:l_mesa'], false],
  ['lanca', 'lanca', 'Lança-chamas', 'Lança-chamas e mangueiras',
    'O maçarico sapecador serve para sapecar carnes, aquecer ferragens e aplicar manta líquida. A mangueira de alta pressão, com registro de fechamento de gás, é feita para os fogões de alta pressão.',
    [['Lança-chamas', '1 m ou 2 m'], ['Bocal', 'zincado'], ['Mangueira', 'modelo KITAP']], ['img:l_lanca', 'img:l_mangueira'], true],
  ['banqueta', 'banquetas', 'Banquetas', 'Banquetas',
    'Banqueta alta com encosto, para bancadas, bares e áreas gourmet, e banqueta baixa com assento em napa, para pé de balcão. Pintura eletrostática e pés emborrachados, em preto ou branco.',
    [['Alta', '95 cm de altura, 4,2 kg'], ['Baixa', '45 cm de altura'], ['Cores', 'preto e branco']], ['img:c_bqa-pt', 'img:c_bqb-pt'], false],
  ['cabideiro', 'cabideiros', 'Cabideiros', 'Cabideiros',
    'Em aço carbono, para pendurar roupas, bolsas e acessórios em halls, quartos ou escritórios.',
    [['Altura', '1,5 m'], ['Largura', '23 cm'], ['Cores', 'branco e preto']], ['img:c_cab-br', 'img:c_cab-pt'], false]
];
const LINHAS_ANTES_2026 = {"engenho": "O P60 extrai caldo de cana para uso doméstico. Moendas em alumínio, engrenagens em ferro fundido e laterais em chapa de aço.", "disco": "Para uma culinária mais rústica: preparo uniforme e sabor caseiro para carnes, legumes e receitas feitas no fogo. Aço carbono de 2 mm, com cabos de madeira.", "banqueta": "Encosto e estrutura com pintura eletrostática, assento espumado e pés emborrachados."};   // textos da versão anterior: só são trocados se ninguém os editou
const FATOS_ANTES_TABELA = {   // destaques da versão anterior: só são trocados se ninguém os editou
  ind5: [['Na foto', '3 bocas com forno, FF102'], ['L × A × P', '1070 × 860 × 465 mm'], ['Peso', '41 kg']],
  ind7: [['Na foto', '4 bocas com forno, FF110TV'], ['L × A × P', '785 × 860 × 830 mm'], ['Peso', '54 kg']],
  alta: [['Na foto', '4 bocas, FF016'], ['L × A × P', '730 × 860 × 465 mm'], ['Peso', '24,5 kg']]
};
const linhasPadrao = () => LINHAS.map(([id, cat, curto, titulo, texto, fatos, fotos, bancada]) => ({ id, cat, curto, titulo, texto, fatos, fotos, bancada, ativo: true }));
function defaults() {
  // Tabela única (JCN, julho de 2026): um preço por produto. Zero significa "a definir".
  const produtos = COLORS.map(([id, nome, codigo, cor, hex, slogan, historia]) => ({
    id, cat: 'colors', nome, codigo, cor, hex, slogan, historia, specs: Object.entries(SPEC_COLORS),
    preco: PRECO_COLORS[id] || 0, grupo: '', grelha: '', sub: '', fornos: [], mostrar_preco: false, ativo: true, fotos: ['img:' + id]
  }));
  // demais itens (catalogo.js). Fogão com as duas grelhas = dois produtos com o mesmo grupo.
  // "fornos" = fornos avulsos que servem naquele fogão: a escolha é opcional e o forno entra no pedido como item à parte.
  const outros = CAT26.map(([id, cat, nome, codigo, cor, hex, txt, specs, foto, preco, grupo, grelha, sub, fk]) => ({
    id, cat, nome, codigo, cor, hex, slogan: '', historia: txt >= 0 ? CAT26_TEXTOS[txt] : '', specs: specs.map(x => x.slice()),
    preco, grupo, grelha, sub, fornos: fk ? FORNOS_POR[fk].slice() : [], mostrar_preco: false, ativo: true, fotos: foto ? ['img:c_' + foto] : []
  }));
  return {
    conteudo: {
      heroTitulo: 'Onze fogões com nome de gente.',
      heroTexto: 'A Linha Colors resgata a tradição e conecta gerações: aço carbono, grelhas de ferro fundido e forno de 100 litros, em onze cores com história.',
      txtG: 'Entre mármore, marcenaria e luz cênica, o Carlos entra de preto. Discreto, mas impossível de passar despercebido: transforma a cozinha em um palco de estilo e essência.',
      txtR: 'A mesma estrutura, outro clima. A Zilda chega com café recém-passado e pão de queijo. É o tipo de calor que não queima, acolhe.',
      galeria: ['img:close_carlos', 'img:close_rosa', 'img:close_helena', 'img:cover'],
      linhas: linhasPadrao(), versaoLinhas: 3,
      pix: { chave: '', favorecido: '', banco: '' }
    },
    catalogo: { versao: 4, categorias: CATEGORIAS.map(([id, nome]) => ({ id, nome, ativa: true })), produtos: produtos.concat(outros) },
    usuarios: [], pedidos: [],
    arquivos: {}
  };
}

let state = null;                         // montado em dados.js a partir do banco
const caps = { dl: null };
function atualizarLinhas() {
  const c = state.conteudo, v = c.versaoLinhas || 1; if (v >= 3) return;
  const novas = linhasPadrao(), igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  novas.forEach(n => {
    const i = c.linhas.findIndex(l => l.id === n.id);
    if (i >= 0) {
      const l = c.linhas[i];
      if (v < 2 && LINHAS_ANTES_2026[n.id] && l.texto === LINHAS_ANTES_2026[n.id]) c.linhas[i] = { ...n, ativo: l.ativo };
      else if (FATOS_ANTES_TABELA[n.id] && igual(l.fatos, FATOS_ANTES_TABELA[n.id])) c.linhas[i] = { ...l, fatos: n.fatos };
      if (n.id === 'alta' && c.linhas[i].cat === 'industriais') c.linhas[i].cat = 'altapressao';
      return;
    }
    if (n.id === 'camping') { const k = c.linhas.findIndex(l => l.id === 'alta'); return c.linhas.splice(k >= 0 ? k + 1 : c.linhas.length, 0, n); }
    if (n.id === 'cabideiro') c.linhas.push(n);
  });
  c.versaoLinhas = 3;
}
function redesenhar() {
  const a = document.activeElement;                                   // não tira o campo de quem está digitando
  if (!$('#site').hidden) {
    renderSite();
    if (ui.drawer && !(a && a.matches && a.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea,select') && a.closest('#overlay')) && typeof renderDrawer === 'function') renderDrawer();
    return;
  }
  if (a && a.matches && a.matches('input:not([type=checkbox]):not([type=file]),textarea,select') && a.closest('#app,#overlay')) return;
  if (typeof refresh === 'function') refresh();
}
function paraB64(blob) { return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); }); }
function reduzirImagem(file, ladoMax = 1000, limite = Files.LIM) {
  return new Promise((ok, no) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      let q = .84, lado = ladoMax;
      const tentar = () => {
        const k = Math.min(1, lado / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => { if (b && b.size > limite && lado > 420) { lado -= 160; q -= .06; tentar(); } else { URL.revokeObjectURL(url); b ? ok(b) : no(new Error('imagem')); } }, 'image/jpeg', q);
      };
      tentar();
    };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error('Não foi possível ler a imagem.')); };
    img.src = url;
  });
}
function src(ref) {
  if (!ref) return TRANSP;
  if (ref.startsWith('img:')) return IMG[ref.slice(4)] || TRANSP;
  if (ref.startsWith('pub:')) return SB.publico(ref.slice(4));
  if (ref.startsWith('file:')) return Files.urlSync(ref.slice(5));
  return TRANSP;
}
let toastT;
function toast(msg) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3800);
}

/* =====================================================================
   CENAS EM TRAÇO (elevações) — desenhadas por código, animadas no scroll
   viewBox 1600×900, piso em y=800, fogão em x 650–950
   ===================================================================== */
const el = (tag, attrs, d = 0, cls = 'ln') => `<${tag} class="${cls}" pathLength="1" style="--d:${d.toFixed(3)}" ${attrs}/>`;
const L = (x1, y1, x2, y2, d, c) => el('line', `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`, d, c);
const R = (x, y, w, h, d, c, rx = 0) => el('rect', `x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"`, d, c);
const C = (cx, cy, r, d, c) => el('circle', `cx="${cx}" cy="${cy}" r="${r}"`, d, c);
const P = (dd, d, c) => el('path', `d="${dd}"`, d, c);
const F = (x, y, w, h, d, o = .06) => `<rect class="fl" style="--d:${d};--o:${o}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;

function cenaGourmet() {
  let b = '', m = '', f = '';
  /* fundo: marcenaria alta com fornos embutidos e adega */
  b += F(100, 40, 460, 760, .04, .05) + R(100, 40, 460, 760, .02, 'ln bold') + L(100, 780, 560, 780, .1, 'ln thin');
  b += L(250, 40, 250, 780, .08) + L(400, 40, 400, 780, .1) + L(175, 40, 175, 780, .14, 'ln thin') + L(168, 380, 168, 450, .18) + L(182, 380, 182, 450, .18);
  [300, 430].forEach((y, i) => { b += R(262, y, 126, 112, .16 + i * .03, 'ln', 4) + R(276, y + 34, 98, 62, .2 + i * .03, 'ln thin', 3) + L(276, y + 18, 374, y + 18, .22 + i * .03, 'ln bold'); });
  b += L(250, 160, 400, 160, .18, 'ln thin') + L(250, 280, 400, 280, .18, 'ln thin') + L(250, 560, 400, 560, .22, 'ln thin') + L(250, 670, 400, 670, .24, 'ln thin') + L(300, 615, 350, 615, .28) + L(300, 725, 350, 725, .3);
  b += R(414, 100, 132, 620, .18, 'ln', 3);
  for (let k = 0; k < 9; k++) { const y = 160 + k * 62; b += L(414, y, 546, y, .22 + k * .015, 'ln thin'); for (let j = 0; j < 4; j++) b += C(434 + j * 31, y - 13, 10, .26 + k * .015 + j * .006, 'ln thin'); }
  /* coifa e painel de mármore atrás do fogão */
  b += P('M740 0 V150 M860 0 V150', .2) + P('M690 150 H910 L940 196 H660 Z', .24, 'ln bold') + L(672, 208, 928, 208, .3, 'ln thin');
  b += F(560, 230, 560, 248, .22, .045) + R(560, 230, 560, 248, .22);
  b += P('M560 300 C640 280 700 350 790 330 S930 250 1010 300 S1080 270 1120 285', .3, 'ln thin') + P('M600 478 C640 420 720 430 760 380 S860 330 900 230', .34, 'ln thin')
    + P('M820 478 C850 440 930 450 980 400 S1060 380 1120 340', .38, 'ln thin') + P('M690 230 C700 262 742 268 760 312', .4, 'ln thin') + P('M560 400 C590 392 610 420 650 410', .42, 'ln thin');
  /* prateleiras iluminadas */
  [250, 345].forEach((y, i) => { b += R(1150, y, 400, 8, .32 + i * .04) + L(1162, y + 15, 1538, y + 15, .56, 'ln thin'); });
  b += P('M1180 250 v-46 h10 v-14 h8 v14 h10 v46', .42) + P('M1224 250 v-60 h8 v-16 h8 v16 h8 v60', .44) + P('M1300 222 a36 28 0 0 0 72 0 Z', .46) + R(1420, 226, 96, 24, .48, 'ln thin') + R(1432, 204, 78, 22, .5, 'ln thin');
  b += P('M1178 345 h60 M1184 337 h48 M1190 329 h36', .48) + P('M1290 345 v-34 a16 16 0 0 1 32 0 v34', .5) + P('M1400 345 l8 -30 h34 l8 30', .52) + P('M1425 315 C1410 290 1400 286 1392 268 M1425 315 C1428 286 1440 280 1446 262 M1425 315 C1444 300 1458 300 1466 286', .56, 'ln thin');
  /* bancadas ao lado do fogão */
  m += F(556, 478, 88, 16, .3, .14) + R(556, 478, 88, 16, .3, 'ln bold') + R(562, 494, 76, 286, .32) + L(562, 590, 638, 590, .36, 'ln thin') + L(562, 686, 638, 686, .38, 'ln thin');
  m += F(956, 478, 170, 16, .3, .14) + R(956, 478, 170, 16, .32, 'ln bold') + R(962, 494, 160, 286, .34) + L(1042, 494, 1042, 780, .38, 'ln thin') + L(962, 570, 1122, 570, .4, 'ln thin');
  m += P('M1062 478 V420 C1062 388 1102 388 1102 420 V434', .44, 'ln bold') + L(1050, 478, 1076, 478, .44);
  /* ilha em mármore com acabamento em cascata, banquetas e pendentes */
  f += `<rect x="1120" y="470" width="540" height="330" style="fill:var(--paper);opacity:clamp(0,calc((var(--draw,0) - .38) * 3),1)"/>`;
  f += F(1120, 470, 540, 330, .4, .06) + R(1120, 470, 540, 22, .4, 'ln bold') + R(1120, 470, 22, 330, .42, 'ln bold') + L(1142, 780, 1660, 780, .46, 'ln thin');
  f += P('M1142 560 C1220 540 1260 620 1340 600 S1480 520 1660 560', .5, 'ln thin') + P('M1200 800 C1230 740 1300 730 1330 680 S1420 640 1450 492', .54, 'ln thin') + P('M1500 800 C1520 760 1580 740 1660 700', .56, 'ln thin') + P('M1142 700 C1170 690 1180 720 1210 716', .58, 'ln thin');
  const banqueta = (x, d) => R(x, 612, 84, 10, d, 'ln bold solid', 5) + P(`M${x + 8} 612 V566 H${x + 76} V612`, d + .02, 'ln solid') + L(x + 10, 622, x + 2, 800, d + .04) + L(x + 74, 622, x + 82, 800, d + .04) + L(x + 6, 724, x + 78, 724, d + .06, 'ln thin');
  f += banqueta(1230, .56) + banqueta(1410, .6);
  [[1250, 230], [1390, 180], [1530, 250]].forEach(([x, y], i) => {
    f += `<polygon class="cone" points="${x - 34},${y + 40} ${x + 34},${y + 40} ${x + 130},470 ${x - 130},470"/>` + L(x, 0, x, y, .5 + i * .04) + P(`M${x - 34} ${y + 40} a34 40 0 0 1 68 0 Z`, .56 + i * .04, 'ln bold solid');
  });
  return `<g class="back">${b}</g><g class="mid">${m}</g><g class="front">${f}</g>`;
}

function cenaResidencial() {
  let b = '', m = '', f = '';
  /* armário alto, janela com cortinas (como na capa do catálogo) */
  b += R(60, 90, 150, 250, .04, 'ln bold') + L(135, 90, 135, 340, .1, 'ln thin') + C(125, 300, 4, .14) + C(145, 300, 4, .14);
  b += L(232, 104, 592, 104, .06, 'ln bold') + C(226, 104, 6, .1) + C(598, 104, 6, .1);
  b += R(272, 130, 280, 290, .08, 'ln bold') + L(412, 130, 412, 420, .14) + L(272, 275, 552, 275, .16) + R(258, 420, 308, 10, .18);
  b += P('M250 104 C262 200 240 300 258 440 H304 C292 330 314 220 302 104 Z', .2, 'ln solid') + P('M268 110 C276 220 262 320 274 436', .26, 'ln thin') + P('M286 110 C296 220 280 330 290 438', .28, 'ln thin');
  b += P('M574 104 C562 200 584 300 566 440 H520 C532 330 510 220 522 104 Z', .22, 'ln solid') + P('M556 110 C548 220 562 320 550 436', .28, 'ln thin') + P('M538 110 C528 220 544 330 534 438', .3, 'ln thin');
  /* azulejos, relógio e prateleira com potes */
  for (let x = 620; x <= 1180; x += 40) b += L(x, 238, x, 478, .2 + (x - 620) / 3000, 'ln thin');
  for (let y = 238; y <= 478; y += 40) b += L(620, y, 1180, y, .24 + (y - 238) / 2000, 'ln thin');
  b += C(1000, 338, 6, .5) + P('M1000 324 q6 7 0 14 q-6 -7 0 -14 M1000 352 q6 -7 0 -14 M986 338 q7 -6 14 0 q-7 6 -14 0 M1014 338 q-7 -6 -14 0', .52, 'ln thin');
  b += C(720, 160, 36, .3, 'ln bold solid') + L(720, 160, 720, 136, .38) + L(720, 160, 738, 170, .38) + C(720, 160, 2.5, .4);
  b += R(1010, 196, 300, 8, .3) + P('M1034 204 v26 l26 -26', .34, 'ln thin') + P('M1286 204 v26 l-26 -26', .34, 'ln thin');
  [[1030, 44, 60], [1084, 40, 46], [1134, 44, 70], [1190, 36, 40], [1236, 36, 40]].forEach(([x, w, h], i) => { b += R(x, 196 - h, w, h, .38 + i * .02, 'ln', 4) + R(x + 4, 188 - h, w - 8, 8, .4 + i * .02, 'ln thin', 2); });
  /* bancadas e armários baixos */
  m += F(76, 478, 568, 12, .3, .14) + R(76, 478, 568, 12, .3, 'ln bold') + R(84, 490, 556, 290, .32);
  for (let i = 1; i < 5; i++) { const x = 84 + i * 111.2; m += L(x, 490, x, 780, .36 + i * .01, 'ln thin') + C(x - 16, 522, 4, .4); }
  m += C(624, 522, 4, .42) + P('M412 478 V440 C412 418 444 418 444 438', .42, 'ln bold');
  m += P('M120 478 l6 -34 h44 l6 34 Z', .44, 'ln solid') + P('M148 444 C130 410 120 400 110 380 M148 444 C150 400 160 390 170 366 M148 444 C170 420 186 416 196 400', .48);
  m += F(956, 478, 240, 12, .32, .14) + R(956, 478, 240, 12, .32, 'ln bold') + R(964, 490, 224, 290, .34) + L(1076, 490, 1076, 780, .38, 'ln thin') + C(1062, 522, 4, .42) + C(1090, 522, 4, .42);
  /* café passado e pão de queijo */
  m += P('M1002 478 l-6 -38 h44 l-6 38 Z', .5, 'ln solid') + P('M992 414 h56 l-12 26 h-32 Z', .52, 'ln solid') + P('M1040 448 q16 4 6 22', .54, 'ln thin');
  m += L(1096, 478, 1176, 478, .54, 'ln bold') + P('M1104 478 a10 9 0 0 1 20 0 M1124 478 a10 9 0 0 1 20 0 M1144 478 a10 9 0 0 1 20 0 M1114 469 a10 9 0 0 1 20 0 M1134 469 a10 9 0 0 1 20 0', .58);
  /* mesa redonda de pé central, cadeiras e pendente */
  f += `<polygon class="cone" points="1345,310 1465,310 1600,556 1210,556"/>` + L(1405, 0, 1405, 252, .5) + P('M1345 310 C1345 250 1465 250 1465 310 Z', .56, 'ln bold solid');
  f += R(1240, 556, 330, 14, .5, 'ln bold solid', 7) + P('M1396 570 V720 C1396 760 1330 770 1310 800 M1414 570 V720 C1414 760 1480 770 1500 800 M1405 724 V800', .56);
  f += P('M1353 530 a52 26 0 0 0 104 0 Z', .6, 'ln solid') + C(1385, 520, 12, .64) + C(1410, 516, 13, .66) + C(1433, 522, 11, .68);
  const cadeira = (x, s, d) => P(`M${x} 800 L${x + 4 * s} 640 L${x - 8 * s} 428`, d, 'ln bold') + R(Math.min(x, x + 92 * s), 634, 92, 10, d + .02, 'ln bold solid', 4) + L(x + 88 * s, 644, x + 92 * s, 800, d + .04, 'ln bold') + L(x + 3 * s, 730, x + 90 * s, 730, d + .06, 'ln thin')
    + P(`M${x - 4 * s} 500 h${14 * s} M${x - 6 * s} 464 h${14 * s}`, d + .06);
  f += cadeira(1196, 1, .6) + cadeira(1612, -1, .64);
  return `<g class="back">${b}</g><g class="mid">${m}</g><g class="front">${f}</g>`;
}
function cenaSobreFogao() {
  /* chaleira e panela sobre as grelhas (só na cozinha residencial) */
  let k = '';
  k += P('M700 492 C690 470 700 446 725 446 C750 446 760 470 750 492 Z', .6, 'ln bold solid') + P('M751 474 l22 -14', .64, 'ln bold') + P('M708 450 C708 424 742 424 742 450', .66) + C(725, 442, 4, .66, 'ln solid');
  k += `<g class="steam">` + P('M780 452 c-8 -14 8 -22 0 -36 M794 446 c-8 -14 8 -22 0 -36', .7, 'ln thin') + `</g>`;
  k += R(845, 462, 70, 30, .62, 'ln bold solid', 3) + L(838, 462, 922, 462, .64, 'ln bold') + P('M872 462 v-8 h16 v8', .66) + L(838, 474, 828, 474, .66) + L(922, 474, 932, 474, .66);
  return k;
}

const DETALHES = [
  ['Grelhas de ferro fundido', 'Quatro grelhas de 30 × 30 em ferro fundido, uma por boca.'],
  ['Bocas simples e duplas', 'Dois queimadores simples e dois duplos.'],
  ['Painel e manípulos', 'Sete manípulos alinhados no painel frontal, na cor do fogão.'],
  ['Estrutura em aço carbono', 'Corpo em aço carbono de alta resistência com pintura eletrostática.'],
  ['Forno de 100 litros', 'Forno embutido, com 580,7 × 670,8 × 450,5 mm por dentro.'],
  ['Pés emborrachados', 'Nas quatro colunas, como em toda a linha.']
];
const OFFS = [-215, -135, -88, -40, 0];
const LBL_Y = [293, 352, 405, 476, 627, 781];

function montarPalco() {
  $('#sceneG').innerHTML = cenaGourmet();
  $('#sceneR').innerHTML = cenaResidencial();
  $('#onStove').innerHTML = cenaSobreFogao();
  $('#stZ').setAttribute('href', IMG.zilda_hi);
  $('#stC').setAttribute('href', IMG.carlos_hi);
  $$('#slices image').forEach(i => i.setAttribute('href', IMG.zilda_hi));
  $('#cu1').src = IMG.close_rosa; $('#cu2').src = IMG.close_helena; $('#cu3').src = IMG.close_carlos;
  // chamas: duas bocas visíveis de frente
  const chama = (x) => `<path class="flame" d="M${x} 522 c-5 -7 -4 -16 0 -24 c4 8 5 17 0 24Z" fill="#3F7FE0"/><path class="flame" d="M${x} 522 c-2 -4 -2 -8 0 -12 c2 4 2 8 0 12Z" fill="#CFE6FF"/>`;
  let fl = ''; [725, 875].forEach(cx => { for (let i = -4; i <= 4; i++) fl += chama(cx + i * 7.5); });
  $('#flames').innerHTML = fl;
  // rótulos da vista explodida (dentro do grupo do fogão para acompanhar a escala)
  const labels = $('#labels');
  labels.innerHTML = DETALHES.map((d, i) => `<g data-l="${i}"><path class="lead" d="M958 ${LBL_Y[i]} H992"/><circle cx="958" cy="${LBL_Y[i]}" r="3" fill="var(--navy)"/><text class="lbl" x="1000" y="${LBL_Y[i] + 6}">${esc(d[0])}</text></g>`).join('');
  $('#details').innerHTML = DETALHES.map((d, i) => `<li data-i="${i}">${esc(d[0])}<span>${esc(d[1])}</span></li>`).join('');
  // faixas
  const cs = COLORS;
  $('#stripes').innerHTML = cs.map(c => `<button class="stripe" style="background:${c[4]}" ${c[0] === 'meire' || c[0] === 'mateus' ? 'data-light' : ''} data-act="ver-modelo" data-id="${c[0]}" aria-label="Ver ${esc(c[1])}, ${esc(c[3])}"></button>`).join('');
  $('#stripeNames').innerHTML = cs.map(c => `<button data-act="ver-modelo" data-id="${c[0]}" tabindex="-1" style="--tc:${lum(c[4]) > 150 ? '#231F20' : '#F6F5F0'}">${esc(c[1])}</button>`).join('');
}

/* ---- motor de scroll: uma variável p (0–1) controla tudo ---- */
const pal = {};
function prepararScroll() {
  pal.stage = $('.stage'); pal.pin = $('#pin'); pal.stripes = $$('.stripe'); pal.g = $('#sceneG'); pal.r = $('#sceneR'); pal.on = $('#onStove');
  pal.stove = $('#stove'); pal.stZ = $('#stZ'); pal.stC = $('#stC'); pal.slices = $('#slices'); pal.sl = $$('#slices .slice'); pal.flames = $('#flames');
  pal.dims = $('#dims'); pal.dimH = $('#dimH'); pal.labels = $('#labels'); pal.lb = $$('#labels g'); pal.det = $$('#details li');
  pal.pG = $('#plateG'); pal.pR = $('#plateR'); pal.pX = $('#plateX');
  pal.lines = $('#linhas'); pal.belt = $('#belt'); pal.ticks = $('#lticks');
  let raf = 0;
  const pedir = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; quadro(); }); };
  addEventListener('scroll', pedir, { passive: true }); addEventListener('resize', pedir);
  quadro();
}
function progresso() {
  const r = pal.stage.getBoundingClientRect(); const total = r.height - innerHeight;
  return total > 0 ? clamp(-r.top / total) : 0;
}
function par(g, t, k) { const [b, m, f] = g.children; if (!b) return; b.style.transform = `translateX(${(-14 * t * k).toFixed(2)}px)`; m.style.transform = `translateX(${(4 * t * k).toFixed(2)}px)`; f.style.transform = `translateX(${(34 * t * k).toFixed(2)}px)`; }
function quadro() {
  if ($('#site').hidden) return;
  quadroLinhas();
  const p = progresso(), S = pal.pin.style;
  const vh = pal.pin.clientHeight, vw = pal.pin.clientWidth;
  const un = Math.min(vh / 900, vw / 680);                                              // 1 unidade do SVG em px; em telas estreitas a cena encolhe para mostrar mais cozinha
  S.setProperty('--svgh', (un * 900).toFixed(1) + 'px');
  // hero
  S.setProperty('--heroText', (1 - seg(p, .015, .075)).toFixed(3));
  const h = seg(p, .045, .15);
  pal.stripes.forEach((s, i) => { s.style.transform = `scaleY(${(1 - ease(clamp(h * 1.5 - i / 10 * .5))).toFixed(3)})`; });
  $('#stripeNames').style.visibility = p > .08 ? 'hidden' : 'visible';
  // escala do fogão: maior no hero, natural nas cozinhas, um pouco maior na vista explodida
  const cabe = (vw * .82) / (300 * un);
  const kx = 1, sHero = Math.min(1.5, cabe), sExp = Math.min(1.2, cabe);
  const e = ease(seg(p, .8, .88));
  let s = lerp(sHero, 1, ease(seg(p, .07, .2))); s = lerp(s, sExp, e);
  const meio = vw / un / 2;                                                            // metade da largura visível, em unidades
  const xo = vw >= 900 ? clamp(Math.min(270, meio - 150 * sHero - 30), 0, 270) * (1 - ease(seg(p, .06, .2))) : 0;
  pal.stove.setAttribute('transform', `translate(${(800 + xo).toFixed(1)} ${800 - 28 * e}) scale(${s.toFixed(4)}) translate(-800 -800)`);
  // cozinha gourmet
  const dG = seg(p, .15, .34), oG = p < .13 ? 0 : 1 - seg(p, .41, .46);
  pal.g.style.setProperty('--draw', dG.toFixed(3)); pal.g.style.setProperty('--op', oG.toFixed(3)); pal.g.style.display = oG ? '' : 'none';
  par(pal.g, seg(p, .15, .46) - .5, 1);
  const c = ease(seg(p, .14, .2)) * (1 - ease(seg(p, .47, .53)));
  pal.stC.setAttribute('opacity', c.toFixed(3));
  // cozinha residencial
  const dR = seg(p, .48, .66), oR = p < .46 ? 0 : 1 - seg(p, .71, .76);
  pal.r.style.setProperty('--draw', dR.toFixed(3)); pal.r.style.setProperty('--op', oR.toFixed(3)); pal.r.style.display = oR ? '' : 'none';
  pal.on.style.setProperty('--draw', dR.toFixed(3)); pal.on.style.setProperty('--op', oR.toFixed(3)); pal.on.style.display = oR ? '' : 'none';
  par(pal.r, seg(p, .48, .76) - .5, 1);
  // vista explodida
  S.setProperty('--grid', (seg(p, .74, .8) * .9).toFixed(3));
  pal.dims.setAttribute('opacity', seg(p, .755, .795).toFixed(3));
  pal.dimH.setAttribute('opacity', (1 - seg(p, .8, .83)).toFixed(3));
  const aberto = e > .001;
  pal.slices.setAttribute('visibility', aberto ? 'visible' : 'hidden');
  pal.stZ.setAttribute('visibility', aberto || c >= .999 ? 'hidden' : 'visible');
  const ativo = p > .815 ? Math.min(5, Math.floor(seg(p, .815, .995) * 6)) : -1;
  const fatiaDe = [0, -1, 1, 2, 3, 4][ativo] ?? -2;   // "Bocas" (1) não é uma fatia: são as chamas
  pal.sl.forEach((g, i) => {
    g.setAttribute('transform', `translate(0 ${(OFFS[i] * e * kx).toFixed(2)})`);
    g.style.opacity = (ativo < 0 || fatiaDe === i || (ativo === 1 && i < 2) || (ativo === 3 && i >= 1)) ? 1 : .4;
  });
  pal.flames.setAttribute('transform', `translate(0 ${(OFFS[1] * e * kx).toFixed(2)})`);
  pal.flames.setAttribute('opacity', ativo === 1 ? 1 : 0);
  pal.labels.setAttribute('opacity', seg(p, .86, .9).toFixed(3));
  pal.lb.forEach((g, i) => g.setAttribute('opacity', i === ativo ? 1 : .4));
  pal.det.forEach((li, i) => li.classList.toggle('on', i === ativo));
  S.setProperty('--cu', seg(p, .81, .87).toFixed(3)); S.setProperty('--par', seg(p, .78, 1).toFixed(3));
  // carimbos
  pal.pG.classList.toggle('on', p > .2 && p < .42);
  pal.pR.classList.toggle('on', p > .53 && p < .72);
  pal.pX.classList.toggle('on', p > .8);
}

/* =====================================================================
   SITE PÚBLICO (lê tudo do estado: o que o admin edita aparece aqui)
   ===================================================================== */
const ui = { modelo: 'zilda', drawer: null, view: null, portal: 'vendas', erro: '', carrinho: null, checkout: null, acesso: null, catLoja: '', sacola: null, compra: null, catSite: 'colors', buscaSite: '' };
const cat = id => state.catalogo.categorias.find(c => c.id === id);
const prod = id => state.catalogo.produtos.find(p => p.id === id);
const colors = () => state.catalogo.produtos.filter(p => p.cat === 'colors' && p.ativo);
const lum = hex => { const n = parseInt(String(hex || '#888').replace('#', ''), 16); return ((n >> 16) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 1000; };
const fundoDe = hex => lum(hex) > 232 ? '#D3D2D2' : lum(hex) < 48 ? '#8E8C86' : hex;   // branco e preto precisam de um fundo que deixe o fogão aparecer
const claro = hex => { const n = parseInt(String(hex || '#888').replace('#', ''), 16); const r = n >> 16, g = n >> 8 & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 232; };

function renderSite() {
  const c = state.conteudo;
  $('#heroTitle').textContent = c.heroTitulo; $('#heroText').textContent = c.heroTexto;
  $('#txtG').textContent = c.txtG; $('#txtR').textContent = c.txtR;
  const lista = colors();
  if (!lista.find(p => p.id === ui.modelo)) ui.modelo = lista[0] ? lista[0].id : null;
  $('#rail').innerHTML = lista.map(p => `<button data-act="modelo" data-id="${esc(p.id)}" aria-pressed="${p.id === ui.modelo}"><i style="background:${esc(p.hex)}"></i>${esc(p.nome)}</button>`).join('');
  const p = prod(ui.modelo);
  $('#model').innerHTML = !p ? `<p class="lead">Nenhum modelo da Linha Colors está ativo no momento.</p>` : `
    <div class="model-photo" style="background:${esc(fundoDe(p.hex))}">
      <span class="corner a"></span><span class="corner b"></span>
      <img src="${src(p.fotos[0])}" alt="Fogão ${esc(p.nome)}, cor ${esc(p.cor)}">
    </div>
    <div class="model-info">
      <h3>${esc(p.nome)}</h3>
      <p class="code">${esc(p.cor)}${p.codigo ? ' — modelo ' + esc(p.codigo) : ''}</p>
      ${p.slogan ? `<p class="slogan">${esc(p.slogan)}</p>` : ''}
      <p class="story">${esc(p.historia)}</p>
      <table class="specs"><tbody>${p.specs.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
      <div class="buy">
        <span class="price">${p.mostrar_preco && precoSite(p) > 0 ? brl(precoSite(p)) : 'Preço sob consulta'}</span>
        <a class="btn" target="_blank" rel="noopener" href="https://wa.me/5517991519932?text=${encodeURIComponent('Olá! Quero um orçamento do fogão ' + p.nome + ' (' + p.cor + '), Linha Colors.')}">Pedir orçamento no WhatsApp</a>
      </div>
    </div>`;
  $('#gallery').innerHTML = c.galeria.map(r => `<figure class="${r === 'img:cover' ? 'wide' : ''}"><img loading="lazy" src="${src(r)}" alt="${r === 'img:cover' ? 'Família tomando café na cozinha, com um fogão Colors ao fundo' : 'Detalhe das grelhas e dos queimadores'}"></figure>`).join('');
  renderLinhas();
  if (typeof renderVitrine === 'function') renderVitrine();            // loja do consumidor final, depois de tudo
}

/* ---- outras linhas: uma "esteira" de painéis que anda com o scroll ---- */
const linhasAtivas = () => state.conteudo.linhas.filter(l => l.ativo && (cat(l.cat) || { ativa: true }).ativa);
function renderLinhas() {
  const ls = linhasAtivas(), sec = $('#linhas');
  sec.hidden = !ls.length; if (!ls.length) return;
  sec.style.height = ((ls.length - 1) * 90 + 100) + 'vh';
  $('#belt').innerHTML = ls.map((l, i) => `<article class="lp${l.bancada ? ' bench' : ''}${l.fotos.length > 1 ? ' duo' : ''}" aria-label="${esc(l.titulo)}">
    ${l.bancada ? '<div class="lp-bench"></div>' : ''}
    <div class="lp-prod">${l.fotos.slice(0, 2).map(r => `<img ${i ? 'loading="lazy"' : ''} src="${src(r)}" alt="${esc(l.titulo)}">`).join('')}</div>
    <div class="lp-text"><h3>${esc(l.titulo)}</h3><p>${esc(l.texto)}</p>
      <dl class="lp-facts">${l.fatos.filter(f => f[0] || f[1]).map(f => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl></div>
  </article>`).join('');
  $('#lindex').innerHTML = ls.map((l, i) => `<button data-act="linha" data-i="${i}">${esc(l.curto || l.titulo)}</button>`).join('');
  pal.lp = $$('#belt .lp'); pal.li = $$('#lindex button'); pal.lAtual = -1;
  if (pal.stage) quadro();
}
function quadroLinhas() {
  const sec = pal.lines; if (!sec || sec.hidden || !pal.lp || !pal.lp.length) return;
  const r = sec.getBoundingClientRect(); if (r.bottom < -50 || r.top > innerHeight + 50) return;
  const total = r.height - innerHeight, q = total > 0 ? clamp(-r.top / total) : 0, N = pal.lp.length;
  const pos = q * (N - 1), i = Math.min(N - 1, Math.floor(pos)), c = i + ease(seg(pos - i, .3, 1));   // cada painel fica parado um trecho antes de andar
  const w = pal.belt.clientWidth;
  pal.belt.style.transform = `translate3d(${(-c * w).toFixed(1)}px,0,0)`;
  pal.ticks.style.backgroundPositionX = (-c * w).toFixed(1) + 'px';
  pal.lp.forEach((p, k) => { const d = k - c, perto = Math.abs(d) < 1.15; p.style.visibility = perto ? '' : 'hidden'; if (perto) p.style.setProperty('--d', d.toFixed(3)); });
  const a = Math.round(c);
  if (a !== pal.lAtual) {
    pal.lAtual = a; pal.li.forEach((b, k) => b.setAttribute('aria-current', k === a));
    $('#lcount').textContent = (a + 1) + ' de ' + N;
    const b = pal.li[a], nav = b.parentNode; nav.scrollLeft = b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2;
  }
}
function irParaLinha(i) {
  const sec = pal.lines, N = pal.lp.length; if (N < 2) return sec.scrollIntoView();
  scrollTo({ top: sec.offsetTop + (sec.offsetHeight - innerHeight) * Math.min(1, (i + .08) / (N - 1)), behavior: 'auto' });
}
function irParaModelo(id) {
  const p = prod(id) || state.catalogo.produtos.find(x => x.leg === id);
  if (p && p.ativo) ui.modelo = p.id;
  renderSite();
  $('#modelos').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
}

/* ---------- Cliente do Supabase (login, banco e arquivos), sem biblioteca externa ----------
   Fala direto com as três portas do projeto: /auth/v1 (login), /rest/v1 (banco) e /storage/v1 (arquivos).
   A chave usada aqui é a pública (publishable): ela só identifica o projeto. Quem decide o que cada pessoa
   lê ou grava são as regras do banco (RLS), no servidor. */
const SB = (() => {
  const U = String(CONFIG.url || '').replace(/\/+$/, ''), K = CONFIG.chave, LSK = 'jcn-acesso';
  let sess = null, renovando = null;
  const lerGuardado = () => { try { return JSON.parse(localStorage.getItem(LSK)) || null; } catch (e) { return null; } };
  sess = lerGuardado();
  const guardar = s => { sess = s; try { if (s) localStorage.setItem(LSK, JSON.stringify(s)); else localStorage.removeItem(LSK); } catch (e) { } };
  const erroDe = (status, j, txt) => { const e = new Error((j && (j.message || j.msg || j.error_description || j.error)) || txt || ('Erro ' + status)); e.status = status; e.code = j && (j.code || j.error_code || j.error); e.detalhe = j; return e; };
  async function chamar(caminho, { method = 'GET', body, headers = {}, token, semLogin = false, cru = false } = {}) {
    const h = { apikey: K, ...headers };
    const t = token || (semLogin ? null : await tokenValido());
    h.Authorization = 'Bearer ' + (t || K);          // sem login, vai a própria chave pública (é assim que a biblioteca oficial do Supabase faz)
    let corpo = body;
    if (body != null && !(body instanceof Blob) && typeof body !== 'string') { corpo = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
    let r;
    try { r = await fetch(U + caminho, { method, headers: h, body: corpo }); }
    catch (e) { const x = new Error('Sem conexão com o servidor. Confira a internet e tente de novo.'); x.rede = true; throw x; }
    if (cru) { if (!r.ok) { let j = null; try { j = await r.json(); } catch (e) { } throw erroDe(r.status, j); } return r; }
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { }
    if (!r.ok) throw erroDe(r.status, j, txt);
    return j;
  }
  // a senha vale por 1 hora no servidor; antes de vencer, troca-se o bilhete por outro sem pedir a senha de novo
  async function tokenValido() {
    if (!sess) return null;
    if (sess.expira - Date.now() > 60000) return sess.access_token;
    // outra aba deste navegador pode já ter renovado: usa o bilhete mais novo em vez de gastar um vencido
    const g = lerGuardado(); if (g && g.id === sess.id && g.expira > sess.expira) { sess = g; if (sess.expira - Date.now() > 60000) return sess.access_token; }
    if (!renovando) renovando = chamar('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token }, semLogin: true })
      .then(j => { aceitar(j); return sess.access_token; })
      .catch(e => { if (e.rede) throw e;             // sem internet: o pedido falha com aviso de conexão, sem derrubar o login
        guardar(null); if (api.aoPerderSessao) setTimeout(api.aoPerderSessao, 0); return null; })
      .finally(() => { renovando = null; });
    return renovando;
  }
  const aceitar = j => guardar({ access_token: j.access_token, refresh_token: j.refresh_token, expira: Date.now() + (j.expires_in || 3600) * 1000, id: j.user.id, email: j.user.email });
  const filtro = f => Object.entries(f || {}).map(([k, v]) => encodeURIComponent(k) + '=' + (Array.isArray(v) ? 'in.(' + v.map(x => encodeURIComponent('"' + String(x).replace(/"/g, '\\"') + '"')).join(',') + ')' : v === null ? 'is.null' : 'eq.' + encodeURIComponent(v))).join('&');
  const pasta = c => String(c).split('/').map(encodeURIComponent).join('/');
  const api = {
    aoPerderSessao: null,                  // avisado quando o servidor não renova mais a sessão (senha trocada, conta removida)
    get id() { return sess ? sess.id : null; },
    get email() { return sess ? sess.email : null; },
    // ----- login
    async entrar(email, senha) { const j = await chamar('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password: senha }, semLogin: true }); aceitar(j); return sess.id; },
    async sair() { const t = sess && sess.access_token; guardar(null); if (t) { try { await chamar('/auth/v1/logout?scope=local', { method: 'POST', token: t, semLogin: true }); } catch (e) { } } },
    async sessaoValida() { return !!(await tokenValido()); },
    async trocarSenha(nova) { return chamar('/auth/v1/user', { method: 'PUT', body: { password: nova } }); },
    async regras() { return chamar('/auth/v1/settings', { semLogin: true }); },
    // cria o login de outra pessoa sem mexer na sessão de quem está logado
    async criarLogin(email, senha) { const j = await chamar('/auth/v1/signup', { method: 'POST', body: { email, password: senha }, semLogin: true }); const u = j.user || j; if (!u || !u.id) throw new Error('O servidor não devolveu o novo acesso.'); return { id: u.id, confirmado: !!(j.access_token || u.email_confirmed_at || u.confirmed_at) }; },
    // ----- banco
    sel(tabela, consulta = 'select=*') { return chamar('/rest/v1/' + tabela + '?' + consulta); },
    async ins(tabela, linhas, { conflito } = {}) { return chamar('/rest/v1/' + tabela + (conflito ? '?on_conflict=' + conflito : ''), { method: 'POST', body: linhas, headers: { Prefer: 'return=representation' + (conflito ? ',resolution=merge-duplicates' : '') } }); },
    async upd(tabela, onde, valores) { return chamar('/rest/v1/' + tabela + '?' + filtro(onde), { method: 'PATCH', body: valores, headers: { Prefer: 'return=representation' } }); },
    async del(tabela, onde) { return chamar('/rest/v1/' + tabela + '?' + filtro(onde), { method: 'DELETE', headers: { Prefer: 'return=representation' } }); },
    rpc(fn, args = {}) { return chamar('/rest/v1/rpc/' + fn, { method: 'POST', body: args }); },
    // ----- arquivos
    async enviar(bucket, caminho, blob, tipo) { return chamar('/storage/v1/object/' + bucket + '/' + pasta(caminho), { method: 'POST', body: blob, headers: { 'Content-Type': tipo || blob.type || 'application/octet-stream', 'x-upsert': 'false', 'cache-control': 'max-age=3600' } }); },
    async baixar(bucket, caminho) { const r = await chamar('/storage/v1/object/authenticated/' + bucket + '/' + pasta(caminho), { cru: true }); return r.blob(); },
    async apagar(bucket, caminho) { return chamar('/storage/v1/object/' + bucket + '/' + pasta(caminho), { method: 'DELETE' }); },
    publico(caminho) { return U + '/storage/v1/object/public/publico/' + pasta(caminho); }
  };
  // login ou saída feitos em outra aba valem aqui também
  addEventListener('storage', ev => {
    if (ev.key !== LSK) return;
    const g = lerGuardado(), era = sess && sess.id; sess = g;
    if (era && (!g || g.id !== era) && api.aoPerderSessao) api.aoPerderSessao();
  });
  return api;
})();

/* =====================================================================
   PORTAIS (login, CMS, vendas internas, e-commerce)
   Autenticação simulada no protótipo; os perfis e permissões abaixo
   espelham as políticas RLS do schema.sql.
   ===================================================================== */
// Representante entra por Vendas internas como o vendedor, mas só faz pedidos: não cria contas nem altera nada.
const PAPEIS = { admin: 'Administrador', vendedor: 'Vendedor', representante: 'Representante', ecommerce: 'E-commerce' };
const GRELHAS = { ferro: 'Ferro fundido', aco: 'Aço carbono' };
// o que distingue o item dentro do modelo, e o nome que vai para o pedido
const detalhe = p => p.grelha ? 'Grelha ' + GRELHAS[p.grelha].toLowerCase() : p.cor;
const rotulo = p => p.grelha ? `${p.nome}, grelha ${GRELHAS[p.grelha].toLowerCase()}` : p.cat === 'colors' ? `${p.nome} (${p.cor})` : p.nome;
// Fogão com as duas grelhas = dois produtos (código e preço próprios) do mesmo grupo: nas vitrines viram um cartão só.
// Aceita produtos ou pares { p, preco } (catálogo de uma loja).
function modelos(lista) { const m = new Map(); lista.forEach(x => { const p = x.p || x, k = p.grupo || p.id; if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return [...m.values()]; }
// Forno é opcional e é outro produto: aqui saem os fornos avulsos que servem no fogão e que a pessoa pode comprar
// (na loja, só os que o administrador liberou, pelo valor da conta).
function fornosDe(p, ctx, u) {
  const lib = ctx === 'loja' ? ((u || {}).liberados || {}) : null;
  return (p.fornos || []).map(prod).filter(f => f && f.ativo && (cat(f.cat) || {}).ativa && (lib ? lib[f.id] > 0 : ctx === 'site' ? precoSite(f) > 0 : f.preco > 0)).map(f => ({ p: f, preco: lib ? lib[f.id] : ctx === 'site' ? precoSite(f) : f.preco }));
}
const nomeForno = (f, curto) => f.nome.replace(/^Forno avulso\s+/i, '').replace(curto ? /\s*\(Perfil \d\)$/ : /^$/, '').replace(/^./, c => c.toUpperCase());   // na ficha do fogão o Perfil já está no título
const rotuloOpcoes = (varias, forno) => varias ? (forno ? 'Escolher grelha e forno' : 'Escolher a grelha') : 'Adicionar, com ou sem forno';
// Todo fogão mostra os dois blocos na ficha: grelha (obrigatória) e forno (opcional), mesmo quando só há uma grelha
// ou quando o forno já vem no fogão. A ficha fica igual em todos, e a pessoa vê por que não há o que escolher.
const specDe = (p, k) => { const s = (p.specs || []).find(x => String(x[0]).trim().toLowerCase() === k); return s ? s[1] : ''; };
const grelhaDe = p => p.grelha ? GRELHAS[p.grelha] : specDe(p, 'grelha');
const ehFogao = p => !!grelhaDe(p);
const ONDE = { loja: ['Adicionar ao carrinho', 'no carrinho'], site: ['Adicionar à sacola', 'na sacola'], venda: ['Adicionar ao pedido', 'no pedido'] };
const NAV = {
  admin: [['produtos', 'Produtos'], ['categorias', 'Categorias'], ['conteudo', 'Site e galeria'], ['catalogo', 'Tabela de preços'], ['lojas', 'Contas e-commerce'], ['novo-pedido', 'Lançar pedido'], ['pedidos', 'Pedidos'], ['financeiro', 'Financeiro'], ['usuarios', 'Usuários']],
  vendedor: [['catalogo', 'Catálogo e preços'], ['novo-pedido', 'Lançar pedido'], ['pedidos', 'Pedidos'], ['lojas', 'Contas e-commerce']],
  representante: [['catalogo', 'Catálogo e preços'], ['novo-pedido', 'Lançar pedido'], ['pedidos', 'Meus pedidos']],
  ecommerce: [['loja', 'Produtos'], ['carrinho', 'Carrinho'], ['pedidos', 'Meus pedidos']]
};
const PIX = { sem: ['Sem comprovante', 'warn'], analise: ['Comprovante em análise', 'info'], verificado: ['PIX verificado', 'ok'], recusado: ['Comprovante recusado', 'bad'] };
const ENVIO = { aguardando: ['Aguardando pagamento', ''], expedicao: ['Em expedição', 'info'], enviado: ['Enviado', 'ok'] };
// Pagamento: PIX (comprovante conferido) ou, nos pedidos lançados pelo vendedor, boleto parcelado.
// O boleto só vale depois de aprovado pelo financeiro (administração); até lá o pedido não segue para a expedição.
const BOLETO_DIAS = [1, 2, 3, 4, 5, 15, 28, 30, 45, 60, 75, 90];
const BOLETO = { pendente: ['Boleto aguardando o financeiro', 'warn'], aprovado: ['Boleto aprovado', 'ok'], recusado: ['Boleto recusado', 'bad'] };
const ehBoleto = p => !!(p.pagamento && p.pagamento.forma === 'boleto');
const pagoOk = p => ehBoleto(p) ? p.pagamento.status === 'aprovado' : p.pix.status === 'verificado';
const paraConferir = p => ehBoleto(p) ? p.pagamento.status === 'pendente' : p.pix.status === 'analise';
const chipPag = p => chip(ehBoleto(p) ? BOLETO[p.pagamento.status] : PIX[p.pix.status]);
const somaDias = (iso, d) => { const t = new Date(iso + 'T12:00:00'); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
const hojeISO = () => { const t = new Date(); return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
// parcelas iguais, em centavos; a diferença do arredondamento vai na última. O prazo conta da data do pedido.
function planoBoleto(total, dias, base) {
  const c = Math.round(total * 100), n = dias.length, cada = Math.floor(c / n);
  return dias.map((d, i) => ({ n: i + 1, de: n, dias: d, vence: somaDias(base, d), valor: (i === n - 1 ? c - cada * (n - 1) : cada) / 100 }));
}
const parcelasDe = p => planoBoleto(totalPedido(p), p.pagamento.dias, p.criado).map(x => ({ ...x, recebida: (p.pagamento.recebidas || []).includes(x.dias) }));
const prazosTxt = dias => dias.length + (dias.length > 1 ? ' parcelas: ' : ' parcela: ') + dias.join(', ') + (dias.length === 1 && dias[0] === 1 ? ' dia' : ' dias');
// loja de e-commerce -> vendedor responsável por ela
const vendedores = () => state.usuarios.filter(u => u.papel === 'vendedor');
const respDe = p => p.origem === 'ecommerce' ? ((user(p.vendedor) || {}).vendedorResp || null) : null;
let sessao = null, scrollSite = 0;
const eu = () => state.usuarios.find(u => u.id === sessao && u.ativo) || null;
const user = id => state.usuarios.find(u => u.id === id);
const chip = ([t, c]) => `<span class="chip ${c}">${esc(t)}</span>`;
const kb = n => n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const precoTxt = v => v > 0 ? brl(v) : 'A definir';   // o catálogo não traz preços: zero é "ainda sem preço"
const totalPedido = p => p.itens.reduce((s, i) => s + i.qtd * i.preco, 0);
const novoPedidoVazio = () => ({ cliente: { nome: '', doc: '', cidade: '' }, itens: [{ produto: '', qtd: 1 }], obs: '', comprovante: null, forma: 'pix', dias: [] });

function abrirApp(portal) {
  if (portal) ui.portal = portal;
  scrollSite = scrollY; $('#site').hidden = true; $('#app').hidden = false; scrollTo(0, 0); renderApp();
  try { sessionStorage.setItem('jcn-area', '1'); } catch (e) { }
  const v = $('#vitrine'); if (v) v.innerHTML = '';                    // a loja do site só existe na tela enquanto o site está aberto
}
function voltarSite() {
  fecharDrawer(); $('#app').hidden = true; $('#site').hidden = false; renderSite(); scrollTo(0, scrollSite); quadro();
  try { sessionStorage.removeItem('jcn-area'); } catch (e) { }
}
function entrarComo(u) {
  sessao = u.id;
  ui.erro = ''; ui.view = NAV[u.papel][0][0]; ui.pedido = null; ui.carrinho = null; ui.checkout = null; ui.acesso = null; renderApp(); scrollTo(0, 0);
}

function renderApp() {
  const u = eu(), app = $('#app');
  if (!u) { app.innerHTML = vLogin(); $('.login-art').style.backgroundImage = `url(${IMG.cover})`; return; }
  const nav = NAV[u.papel] || NAV.vendedor; if (!nav.find(n => n[0] === ui.view)) ui.view = nav[0][0];
  const views = { produtos: vProdutos, categorias: vCategorias, conteudo: vConteudo, catalogo: vCatalogo, lojas: vLojas, loja: vLoja, carrinho: vCarrinho, 'novo-pedido': vNovoPedido, pedidos: vPedidos, financeiro: vFinanceiro, usuarios: vUsuarios };
  const selo = id => { const n = id === 'carrinho' ? qtdCarrinho() : (id === 'pedidos' || id === 'financeiro') && u.papel === 'admin' ? state.pedidos.filter(p => id === 'financeiro' ? ehBoleto(p) && paraConferir(p) : paraConferir(p)).length : 0; return n ? `<span class="badge" aria-label="${n} ${id === 'carrinho' ? 'no carrinho' : id === 'financeiro' ? 'boletos para aprovar' : 'com pagamento para conferir'}">${n}</span>` : ''; };
  app.innerHTML = `<div class="shell">
    <aside class="side">
      <span class="logo on-dark"><b>JCN</b><i>GOURMET</i></span>
      <div class="who"><b>${esc(u.nome)}</b>${esc(PAPEIS[u.papel])}, ${esc(u.empresa)}</div>
      <nav aria-label="Portal">${nav.map(([id, t]) => `<button data-act="nav" data-view="${id}" ${id === ui.view ? 'aria-current="page"' : ''}>${t}${selo(id)}</button>`).join('')}</nav>
      <div class="bottom"><button data-act="voltar-site">Ver o site</button><button data-act="minha-senha">Trocar senha</button><button data-act="sair">Sair</button></div>
    </aside>
    <section class="main">${views[ui.view](u)}</section></div>`;
}

/* ---------- login ---------- */
const PORTAIS = {
  vendas: ['Vendas internas', 'Para a equipe JCN, vendedores e representantes: tabela de preços, pedidos, comprovantes de PIX e etiquetas de envio.', 'Entrar no Portal de Vendas'],
  ecommerce: ['E-commerce', 'Para lojas online cadastradas pela JCN: produtos e valores liberados para a sua conta, carrinho, pagamento por PIX e envio das etiquetas.', 'Entrar na Área do E-commerce']
};
const portalDe = u => u.papel === 'ecommerce' ? 'ecommerce' : 'vendas';
function vLogin() {
  if (!PORTAIS[ui.portal]) ui.portal = 'vendas';
  const pt = ui.portal, loja = pt === 'ecommerce';
  return `<div class="login">
    <div class="login-art">
      <span class="logo on-dark"><b>JCN</b><i>GOURMET</i></span>
      <div><h1>Colors</h1><p>Área restrita da JCN Gourmet: vendas internas e lojas de e-commerce, cada uma com o seu acesso.</p></div>
    </div>
    <div class="login-form">
      <button class="btn ghost sm" style="align-self:flex-start" data-act="voltar-site">Voltar ao site</button>
      <h2>Entrar</h2>
      <div class="tabs" role="tablist">
        ${Object.entries(PORTAIS).map(([k, v]) => `<button role="tab" aria-selected="${k === pt}" data-act="portal" data-portal="${k}">${v[0]}</button>`).join('')}
      </div>
      <p class="note" style="margin:0">${PORTAIS[pt][1]}</p>
      <label class="field"><span>${loja ? 'Login' : 'E-mail'}</span><input id="lgEmail" type="text" autocomplete="username" autocapitalize="none" spellcheck="false"></label>
      <label class="field"><span>Senha</span><input id="lgSenha" type="password" autocomplete="current-password"></label>
      ${ui.erro ? `<p class="err" role="alert" style="margin:0">${esc(ui.erro)}</p>` : ''}
      <button class="btn" data-act="entrar">${PORTAIS[pt][2]}</button>
      <p class="note" style="margin:0">${loja ? 'O login e a senha de cada loja são criados pela JCN Gourmet. Se você esqueceu a senha, peça uma nova ao seu vendedor.' : 'Use o e-mail e a senha que a administração da JCN cadastrou para você.'}</p>
    </div></div>`;
}

/* ---------- CMS: produtos ---------- */
function vProdutos() {
  const f = ui.filtroCat || '', q = (ui.buscaProd || '').trim().toLowerCase(), todos = state.catalogo.produtos;
  const semPreco = p => !(p.preco > 0);
  const lista = todos.filter(p => (!f || p.cat === f) && (!ui.soSemPreco || semPreco(p)) && (!q || (p.nome + ' ' + p.codigo + ' ' + detalhe(p)).toLowerCase().includes(q)));
  const nSem = todos.filter(semPreco).length;
  return `<h1>Produtos</h1><p class="sub">Edite fotos, preços e especificações. O que estiver ativo aparece no site e nas tabelas de preço, sem mexer em código.</p>
  <div class="bar"><label class="sr" for="fc">Categoria</label><select id="fc" class="inp" style="width:auto" data-chg="filtro-cat"><option value="">Todas as categorias</option>${state.catalogo.categorias.map(c => `<option value="${esc(c.id)}" ${c.id === f ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>
    <label class="sr" for="bp">Buscar produto</label><input id="bp" class="inp" style="width:min(16rem,100%)" type="search" placeholder="Buscar por nome ou código" data-chg="busca-prod" value="${esc(ui.buscaProd || '')}">
    <label class="check" style="font-weight:600"><input type="checkbox" id="sp" data-act="so-sem-preco" ${ui.soSemPreco ? 'checked' : ''}>Só sem preço</label>
    <span class="grow"></span><button class="btn" data-act="novo-produto">Adicionar produto</button></div>
  <p class="note" style="margin:-4px 0 12px">${lista.length} de ${todos.length} produtos.${nSem ? ` ${nSem} ainda sem preço: enquanto o preço estiver "A definir", o item não entra em pedidos.` : ''}</p>
  ${lista.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Produto</th><th>Código</th><th>Categoria</th><th class="num">Preço</th><th>Ativo</th><th></th></tr></thead><tbody>
  ${lista.map(p => `<tr><td><div class="thumb">${p.fotos[0] ? `<img loading="lazy" src="${src(p.fotos[0])}" alt="">` : ''}</div></td>
    <td><b>${esc(p.nome)}</b><br><span class="note">${p.grelha ? '' : `<i class="sw" style="background:${esc(p.hex)}"></i>`}${esc(detalhe(p))}${p.grupo ? ' · faz par com ' + esc(state.catalogo.produtos.filter(x => x.grupo === p.grupo && x.id !== p.id).map(x => x.codigo || x.nome).join(', ')) : ''}</span></td>
    <td>${esc(p.codigo) || '<span class="note">sem código</span>'}</td><td>${esc((cat(p.cat) || {}).nome || '')}</td><td class="num">${semPreco(p) ? '<span class="chip warn">A definir</span>' : brl(p.preco)}</td>
    <td><input type="checkbox" class="toggle" data-act="toggle-prod" data-id="${esc(p.id)}" ${p.ativo ? 'checked' : ''} aria-label="${esc(p.nome)} ativo"></td>
    <td><button class="btn ghost sm" data-act="editar-produto" data-id="${esc(p.id)}">Editar</button></td></tr>`).join('')}
  </tbody></table></div>` : `<div class="empty">Nenhum produto com este filtro.</div>`}
  <p class="note">Cadastro conforme o Catálogo JCN 2026 e a Tabela de preços JCN de julho de 2026.</p>`;
}
function dProduto(d) {
  const novo = !prod(d.id);
  return `<h2 class="dt">${novo ? 'Novo produto' : 'Editar ' + esc(d.nome)}</h2>
  <div class="rows">
    <div class="grid2"><label class="field"><span>Nome</span><input data-f="nome" value="${esc(d.nome)}"></label><label class="field"><span>Código do modelo</span><input data-f="codigo" value="${esc(d.codigo)}"></label></div>
    <div class="grid2"><label class="field"><span>Categoria</span><select data-f="cat">${state.catalogo.categorias.map(c => `<option value="${esc(c.id)}" ${c.id === d.cat ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></label>
      <label class="field"><span>Nome da cor</span><input data-f="cor" value="${esc(d.cor)}"></label></div>
    <div class="grid2"><label class="field"><span>Amostra da cor</span><input type="color" data-f="hex" value="${esc(d.hex)}"></label><label class="field"><span>Frase de destaque</span><input data-f="slogan" value="${esc(d.slogan)}"></label></div>
    <label class="field"><span>História ou descrição</span><textarea data-f="historia">${esc(d.historia)}</textarea></label>
  </div>
  <div class="panel" style="margin-top:16px"><h2>Especificações técnicas</h2><div class="rows">
    ${d.specs.map((s, i) => `<div class="row-line" style="grid-template-columns:1fr 1.4fr auto"><input class="inp" aria-label="Item" data-f="specs.${i}.0" value="${esc(s[0])}"><input class="inp" aria-label="Valor" data-f="specs.${i}.1" value="${esc(s[1])}"><button class="btn ghost sm" data-act="spec-rem" data-i="${i}" aria-label="Remover linha">×</button></div>`).join('')}
    <button class="btn ghost sm" style="justify-self:start" data-act="spec-add">Adicionar linha</button></div></div>
  <div class="panel"><h2>Preço</h2><div class="grid2">
    <label class="field"><span>Tabela JCN (R$)</span><input id="pdPreco" type="number" min="0" step="0.01" inputmode="decimal" data-f="preco" data-num value="${esc(d.preco)}"></label></div>
    <p class="note" style="margin:8px 0 0">Zero deixa o produto "A definir": ele não entra em pedidos até ter preço.</p>
    <label class="check" style="margin-top:10px"><input type="checkbox" data-f="mostrar_preco" ${d.mostrar_preco ? 'checked' : ''}>Mostrar o preço no site</label></div>
  <div class="panel"><h2>Opção de grelha</h2><div class="grid2">
    <label class="field"><span>Grelha deste código</span><select id="pdGrelha" data-f="grelha"><option value="">Não se aplica</option>${Object.entries(GRELHAS).map(([k, t]) => `<option value="${k}" ${k === d.grelha ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="field"><span>Mesmo fogão com a outra grelha</span><select id="pdPar" data-f="par"><option value="">Nenhum</option>${state.catalogo.produtos.filter(x => x.id !== d.id && x.cat === d.cat && x.grelha).map(x => `<option value="${esc(x.id)}" ${x.id === d.par ? 'selected' : ''}>${esc(x.codigo || 'sem código')} · ${esc(rotulo(x))}</option>`).join('')}</select></label></div>
    <p class="note" style="margin:8px 0 0">Dois códigos ligados aqui aparecem como um fogão só para o vendedor e para a loja, que escolhem a grelha ao abrir o produto.</p></div>
  ${d.cat === 'fornosavulsos' ? '' : (() => { const fs = state.catalogo.produtos.filter(x => x.cat === 'fornosavulsos' && x.id !== d.id), n = (d.fornos || []).length;
    return fs.length ? `<details class="panel dobra" ${n ? 'open' : ''}><summary><h2>Forno opcional</h2><span class="note" id="pdFornosN">${n ? n + (n > 1 ? ' fornos' : ' forno') : 'nenhum'}</span></summary>
    <p class="note" style="margin:0 0 10px">Marque os fornos avulsos que servem neste fogão. Na ficha, depois da grelha, a pessoa pode levar um deles ou ficar sem forno. O forno entra no pedido como item separado, pelo preço dele.${d.grelha ? ' Vale também para o código da outra grelha.' : ''}</p>
    <div class="marcas">${fs.map(f => `<label class="check"><input type="checkbox" data-act="forno-serve" data-id="${esc(f.id)}" ${(d.fornos || []).includes(f.id) ? 'checked' : ''}>${esc(nomeForno(f))} <span class="note">${esc(f.codigo)} · ${precoTxt(f.preco)}</span></label>`).join('')}</div></details>` : ''; })()}
  <div class="panel"><h2>Fotos</h2><div class="photos">
    ${d.fotos.map((r, i) => `<div class="ph"><img src="${src(r)}" alt=""><button data-act="foto-rem" data-i="${i}" aria-label="Remover foto">×</button></div>`).join('')}
    <label tabindex="0" class="btn ghost sm" style="align-self:center">Adicionar foto<input type="file" accept="image/*" hidden data-file="foto-produto"></label></div>
    <p class="note" style="margin:8px 0 0">A primeira foto é a principal. As imagens são reduzidas antes de salvar.</p></div>
  <label class="check"><input type="checkbox" data-f="ativo" ${d.ativo ? 'checked' : ''}>Ativo no site e nas tabelas de preço</label>
  <div class="foot"><button class="btn" data-act="salvar-produto">Salvar produto</button><button class="btn ghost" data-act="fechar">Cancelar</button>
    ${novo ? '' : `<span style="flex:1"></span><button class="btn danger" data-act="remover-produto" data-confirm="Confirmar remoção">Remover produto</button>`}</div>`;
}

/* ---------- CMS: categorias e conteúdo ---------- */
function vCategorias() {
  return `<h1>Categorias</h1><p class="sub">Organize o catálogo. Categorias inativas somem do site, junto com seus produtos.</p>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nome</th><th class="num">Produtos</th><th>Ativa</th><th></th></tr></thead><tbody>
  ${state.catalogo.categorias.map(c => { const n = state.catalogo.produtos.filter(p => p.cat === c.id).length; return `<tr>
    <td><input class="inp" aria-label="Nome da categoria" data-chg="cat-nome" data-id="${esc(c.id)}" value="${esc(c.nome)}"></td><td class="num">${n}</td>
    <td><input type="checkbox" class="toggle" data-act="toggle-cat" data-id="${esc(c.id)}" ${c.ativa ? 'checked' : ''} aria-label="${esc(c.nome)} ativa"></td>
    <td><button class="btn danger sm" data-act="cat-rem" data-id="${esc(c.id)}" data-confirm="Confirmar" ${n || c.id === 'colors' ? 'disabled title="Mova ou remova os produtos antes"' : ''}>Remover</button></td></tr>`; }).join('')}
  </tbody></table></div>
  <div class="bar" style="margin-top:14px"><label class="sr" for="novaCat">Nova categoria</label><input id="novaCat" class="inp" style="max-width:20rem" placeholder="Nome da nova categoria"><button class="btn" data-act="cat-add">Criar categoria</button></div>`;
}
function vConteudo() {
  const c = state.conteudo;
  const campo = (k, t, area) => `<label class="field"><span>${t}</span>${area ? `<textarea data-chg="conteudo" data-k="${k}">${esc(c[k])}</textarea>` : `<input data-chg="conteudo" data-k="${k}" value="${esc(c[k])}">`}</label>`;
  return `<h1>Site e galeria</h1><p class="sub">Textos da abertura e das cenas, e as fotos da seção "De perto". As mudanças valem assim que você sai do campo.</p>
  <div class="panel"><h2>Abertura</h2><div class="rows">${campo('heroTitulo', 'Título')}${campo('heroTexto', 'Texto de apoio', 1)}</div></div>
  <div class="panel"><h2>Legendas das cozinhas</h2><div class="rows">${campo('txtG', 'Cozinha gourmet', 1)}${campo('txtR', 'Cozinha residencial', 1)}</div></div>
  <div class="panel"><h2>Galeria</h2><div class="photos">
    ${c.galeria.map((r, i) => `<div class="ph"><img src="${src(r)}" alt=""><button data-act="gal-rem" data-i="${i}" aria-label="Remover foto">×</button></div>`).join('')}
    <label tabindex="0" class="btn ghost sm" style="align-self:center">Adicionar foto<input type="file" accept="image/*" hidden data-file="foto-galeria"></label></div></div>
  <div class="panel"><h2>Loja do site (consumidor final)</h2>
    <p class="note" style="margin:0 0 10px">Fica no fim da página inicial, depois das outras linhas. Mostra os produtos ativos que têm preço, pelo valor da tabela JCN mais o acréscimo abaixo. Os pedidos chegam em Pedidos, com a origem "Loja do site".</p>
    <div class="grid2"><label class="field"><span>Acréscimo sobre a tabela (%)</span><input id="ljAcr" type="number" min="0" max="500" step="0.5" inputmode="decimal" data-chg="loja-site" data-k="acrescimo" value="${esc(c.loja.acrescimo)}"></label>
      <p class="note" id="ljExemplo" style="align-self:end;margin:0 0 8px">${(() => { const z = state.catalogo.produtos.find(p => p.preco > 0); return z ? `Exemplo: ${esc(z.nome)} sai de ${brl(z.preco)} na tabela para ${brl(precoSite(z))} no site.` : ''; })()}</p></div>
    <label class="check" style="margin-top:10px"><input type="checkbox" id="ljAtiva" data-chg="loja-site" data-k="ativa" ${c.loja.ativa ? 'checked' : ''}>Loja aberta na página inicial</label></div>
  <div class="panel"><h2>Outras linhas (esteira da página inicial)</h2>
    <p class="note" style="margin:0 0 10px">Depois da Linha Colors, a página passa por estas linhas na ordem abaixo, conforme a pessoa rola. Use fotos com fundo branco: o fundo some sobre o papel.</p>
    <div class="tbl-wrap"><table class="tbl" style="min-width:520px"><thead><tr><th></th><th>Linha</th><th>Categoria</th><th>Ativa</th><th></th></tr></thead><tbody>
    ${c.linhas.map((l, i) => `<tr><td><div class="thumb" style="background:#fff">${l.fotos[0] ? `<img src="${src(l.fotos[0])}" alt="">` : ''}</div></td>
      <td><b>${esc(l.titulo)}</b><br><span class="note">${i + 1}º na esteira</span></td><td>${esc((cat(l.cat) || {}).nome || '')}</td>
      <td><input type="checkbox" class="toggle" data-act="toggle-linha" data-id="${esc(l.id)}" ${l.ativo ? 'checked' : ''} aria-label="${esc(l.titulo)} ativa"></td>
      <td style="white-space:nowrap"><button class="btn ghost sm" data-act="linha-sobe" data-id="${esc(l.id)}" ${i ? '' : 'disabled'} aria-label="Mover ${esc(l.titulo)} para cima">↑</button>
        <button class="btn ghost sm" data-act="linha-desce" data-id="${esc(l.id)}" ${i < c.linhas.length - 1 ? '' : 'disabled'} aria-label="Mover ${esc(l.titulo)} para baixo">↓</button>
        <button class="btn ghost sm" data-act="editar-linha" data-id="${esc(l.id)}">Editar</button></td></tr>`).join('')}
    </tbody></table></div>
    <button class="btn sm" style="margin-top:10px" data-act="nova-linha">Adicionar linha</button></div>
  <button class="btn ghost" data-act="voltar-site">Ver no site</button>`;
}
function dLinha(d) {
  const nova = !state.conteudo.linhas.find(l => l.id === d.id);
  return `<h2 class="dt">${nova ? 'Nova linha' : 'Editar ' + esc(d.titulo)}</h2>
  <div class="rows">
    <div class="grid2"><label class="field"><span>Título</span><input data-f="titulo" value="${esc(d.titulo)}"></label><label class="field"><span>Nome curto (índice)</span><input data-f="curto" value="${esc(d.curto)}"></label></div>
    <label class="field"><span>Categoria</span><select data-f="cat">${state.catalogo.categorias.map(c => `<option value="${esc(c.id)}" ${c.id === d.cat ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></label>
    <label class="field"><span>Texto</span><textarea data-f="texto">${esc(d.texto)}</textarea></label>
  </div>
  <div class="panel" style="margin-top:16px"><h2>Três destaques</h2><div class="rows">
    ${d.fatos.map((f, i) => `<div class="row-line" style="grid-template-columns:1fr 1.6fr"><input class="inp" aria-label="Rótulo ${i + 1}" placeholder="Rótulo" data-f="fatos.${i}.0" value="${esc(f[0])}"><input class="inp" aria-label="Valor ${i + 1}" placeholder="Valor" data-f="fatos.${i}.1" value="${esc(f[1])}"></div>`).join('')}</div></div>
  <div class="panel"><h2>Fotos (até duas)</h2><div class="photos">
    ${d.fotos.map((r, i) => `<div class="ph" style="background:#fff"><img src="${src(r)}" alt=""><button data-act="lfoto-rem" data-i="${i}" aria-label="Remover foto">×</button></div>`).join('')}
    ${d.fotos.length < 2 ? `<label tabindex="0" class="btn ghost sm" style="align-self:center">Adicionar foto<input type="file" accept="image/*" hidden data-file="foto-linha"></label>` : ''}</div></div>
  <label class="check"><input type="checkbox" data-f="bancada" ${d.bancada ? 'checked' : ''}>Produto de bancada (aparece sobre uma mesa desenhada)</label>
  <label class="check" style="margin-top:8px"><input type="checkbox" data-f="ativo" ${d.ativo ? 'checked' : ''}>Ativa na página inicial</label>
  <div class="foot"><button class="btn" data-act="salvar-linha">Salvar linha</button><button class="btn ghost" data-act="fechar">Cancelar</button>
    ${nova ? '' : `<span style="flex:1"></span><button class="btn danger" data-act="remover-linha" data-confirm="Confirmar remoção">Remover linha</button>`}</div>`;
}

/* ---------- vendas: catálogo pela tabela única, com a ficha do produto ---------- */
const fotoDe = (p, alt = '') => p.fotos[0] ? `<img loading="lazy" src="${src(p.fotos[0])}" alt="${esc(alt)}">` : '<span class="note">Sem foto</span>';
function vCatalogo(u) {
  const todos = state.catalogo.produtos.filter(p => p.ativo && (cat(p.cat) || {}).ativa), cats = state.catalogo.categorias.filter(c => todos.some(p => p.cat === c.id));
  if (!cats.some(c => c.id === ui.catVenda)) ui.catVenda = '';
  const q = (ui.buscaVenda || '').trim().toLowerCase();
  const achados = todos.filter(p => (!ui.catVenda || p.cat === ui.catVenda) && (!q || (p.nome + ' ' + p.codigo + ' ' + detalhe(p)).toLowerCase().includes(q)));
  const gs = new Set(achados.map(p => p.grupo).filter(Boolean)), lista = todos.filter(p => achados.includes(p) || gs.has(p.grupo));   // achou uma grelha, mostra o fogão com as duas
  const ms = modelos(lista); let sub = '';
  return `<h1>${u.papel === 'admin' ? 'Tabela de preços' : 'Catálogo e preços'}</h1><p class="sub">Tabela de preços JCN de julho de 2026. Abra um produto para ver a ficha; nos fogões com duas grelhas, a escolha entre ferro fundido e aço carbono aparece ali, junto com o forno, que é opcional.</p>
  <div class="bar"><label class="sr" for="fv">Categoria</label><select id="fv" class="inp" style="width:auto" data-chg="filtro-venda"><option value="">Todas as categorias</option>${cats.map(c => `<option value="${esc(c.id)}" ${c.id === ui.catVenda ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>
    <label class="sr" for="bv">Buscar</label><input id="bv" class="inp" style="width:min(16rem,100%)" type="search" placeholder="Buscar por nome ou código" data-chg="busca-venda" value="${esc(ui.buscaVenda || '')}"></div>
  <p class="note" style="margin:-4px 0 12px">${ms.length} ${ms.length === 1 ? 'produto' : 'produtos'}, ${lista.length} ${lista.length === 1 ? 'código' : 'códigos'}.</p>
  ${ms.length ? `<div class="cards">${ms.map(g => { const p = g[0], varias = g.length > 1, ids = g.map(x => x.id).join(','), com = g.map(x => x.preco).filter(v => v > 0), fo = com.length && fornosDe(p, 'venda', u).length;
    let titulo = '';                                                   // com a categoria filtrada, os subgrupos da tabela viram títulos
    if (ui.catVenda && !q && (p.sub || '') !== sub) { sub = p.sub || ''; if (sub) titulo = `<h2 class="subh">${esc(sub)}</h2>`; }
    return titulo + `<div class="card"><button class="ph" data-act="ficha" data-ids="${esc(ids)}" data-ctx="venda" aria-label="Abrir ${esc(p.nome)}">${fotoDe(p)}</button>
    <h3>${esc(p.nome)}</h3><span class="note">${varias ? g.map(x => `${esc(GRELHAS[x.grelha])} ${esc(x.codigo)}`).join(' · ') : (p.grelha ? '' : `<i class="sw" style="background:${esc(p.hex)}"></i>`) + esc(detalhe(p)) + (p.codigo ? ', ' + esc(p.codigo) : '')}</span>
    <span class="price${com.length ? '' : ' nd'}">${varias && com.length ? 'A partir de ' + brl(Math.min(...com)) : precoTxt(com[0] || 0)}</span>
    ${fo ? '<span class="chip">Forno opcional</span>' : ''}
    ${varias || fo ? `<button class="btn sm" data-act="ficha" data-ids="${esc(ids)}" data-ctx="venda">${rotuloOpcoes(varias, fo)}</button>`
             : `<button class="btn ghost sm" data-act="add-ao-pedido" data-id="${esc(p.id)}" ${p.preco > 0 ? '' : 'disabled'}>${p.preco > 0 ? 'Adicionar ao pedido' : 'Sem preço na tabela'}</button>`}</div>`; }).join('')}</div>`
  : `<div class="empty">Nenhum produto com este filtro.</div>`}`;
}
/* Ficha do produto: aparece ao abrir um cartão. Se o fogão tem as duas grelhas, é aqui que se escolhe. */
function fichaOpcoes(dr, u) {                                          // variantes que quem abriu pode comprar, pelo preço que vale para essa pessoa
  const lib = dr.ctx === 'loja' ? (u.liberados || {}) : null, site = dr.ctx === 'site';      // no site: só o que tem preço, pela tabela + acréscimo
  return dr.ids.map(prod).filter(p => p && p.ativo && (!lib || lib[p.id] > 0) && (!site || (precoSite(p) > 0 && (cat(p.cat) || {}).ativa))).map(p => ({ p, preco: lib ? lib[p.id] : site ? precoSite(p) : p.preco }));
}
function dFicha(dr, u) {
  const ops = fichaOpcoes(dr, u);
  if (!ops.length) return `<h2 class="dt">Produto indisponível</h2><p class="note">Este produto não está mais disponível.</p><div class="foot"><button class="btn ghost" data-act="fechar">Fechar</button></div>`;
  if (!ops.some(o => o.p.id === dr.sel)) dr.sel = ops.length === 1 ? ops[0].p.id : null;       // com duas grelhas, nada vem marcado: a pessoa escolhe
  const at = ops.find(o => o.p.id === dr.sel) || null, p = (at || ops[0]).p, loja = dr.ctx === 'loja', varias = ops.length > 1;
  const semPreco = at && !(at.preco > 0);
  const fs = fornosDe(p, dr.ctx, u); if (!fs.some(f => f.p.id === dr.forno)) dr.forno = '';
  const fa = fs.find(f => f.p.id === dr.forno);
  return `<h2 class="dt">${esc(p.nome)}</h2>
  <div class="ficha"><div class="ph">${fotoDe(p, p.nome)}</div>
    <div class="ficha-lado">
    ${varias ? `<fieldset class="opts grelhas"><legend>Escolha a grelha <span class="opc obr">obrigatória</span></legend>${ops.map(o => `<label class="opt${o.p.id === dr.sel ? ' sel' : ''}"><input type="radio" name="fx" id="fx-${esc(o.p.id)}" value="${esc(o.p.id)}" data-act="ficha-sel" ${o.p.id === dr.sel ? 'checked' : ''}>
        <span class="on"><b>${esc(GRELHAS[o.p.grelha] || detalhe(o.p))}</b><small>${esc(o.p.codigo || 'sem código')}</small></span><span class="pv">${precoTxt(o.preco)}</span></label>`).join('')}</fieldset>`
      : `<p class="um"><span><b>${esc(detalhe(p))}</b><small>${esc(p.codigo || 'sem código')}</small></span><span class="pv">${precoTxt(at.preco)}</span></p>
        ${grelhaDe(p) ? `<div class="opts grelha-unica"><p class="leg">Grelha <span class="opc obr">obrigatória</span></p>
          <p class="opt sel fixa"><span class="bola" aria-hidden="true"></span><span class="on"><b>${esc(grelhaDe(p))}</b><small>Única grelha deste modelo, já escolhida</small></span></p></div>` : ''}`}
    </div></div>
  <div class="ficha-mais">
    ${fs.length ? `<fieldset class="opts fornos"><legend>Forno <span class="opc">opcional</span></legend>
      <label class="opt${fa ? '' : ' sel'}"><input type="radio" name="ff" id="ff-nenhum" value="" data-act="ficha-forno" ${fa ? '' : 'checked'}><span class="on"><b>Sem forno</b></span></label>
      ${fs.map(f => `<label class="opt${f === fa ? ' sel' : ''}"><input type="radio" name="ff" id="ff-${esc(f.p.id)}" value="${esc(f.p.id)}" data-act="ficha-forno" ${f === fa ? 'checked' : ''}>
        <span class="on"><b>${esc(nomeForno(f.p, true))}</b><small>${esc(f.p.codigo || 'sem código')}</small></span><span class="pv mais">+ ${brl(f.preco)}</span></label>`).join('')}</fieldset>`
    : ehFogao(p) ? `<div class="opts forno-info"><p class="leg">Forno <span class="opc">opcional</span></p>
      <p class="opt fixa"><span class="on">${specDe(p, 'forno interno') || specDe(p, 'forno') ? '<b>Este fogão já vem com forno</b><small>Não há forno avulso para escolher.</small>'
        : dr.ctx === 'loja' && (p.fornos || []).length ? '<b>Nenhum forno liberado para a sua conta</b><small>Peça a liberação ao seu contato comercial na JCN.</small>'
        : '<b>Este modelo não leva forno avulso</b><small>Os fornos avulsos servem nos fogões de piso de 2 a 6 bocas, Perfil 5 e Perfil 7.</small>'}</span></p></div>` : ''}
    ${at && !semPreco && fa ? `<p class="soma">Fogão ${brl(at.preco)} + forno ${brl(fa.preco)} = <b>${brl(at.preco + fa.preco)}</b> o conjunto. O forno entra como item separado, com o código dele.</p>` : ''}
    <div class="buyrow"><div class="qty"><button data-act="fq" data-d="-1" aria-label="Diminuir">−</button><input id="fq" type="number" min="1" max="999" step="1" inputmode="numeric" aria-label="Quantidade" data-chg="ficha-qtd" value="${dr.qtd || 1}"><button data-act="fq" data-d="1" aria-label="Aumentar">+</button></div>
      <button class="btn" data-act="ficha-add" ${at && !semPreco ? '' : 'disabled'}>${!at ? 'Escolha a grelha' : (ONDE[dr.ctx] || ONDE.venda)[0] + (fa ? ' com forno' : '')}</button></div>
    ${semPreco ? '<p class="note" style="margin:8px 0 0">Este código ainda não tem preço na tabela.</p>' : ''}
    ${at ? '' : '<p class="note" style="margin:8px 0 0">Cada grelha tem código e preço próprios. Marque uma das duas para continuar.</p>'}
  </div>
  ${at && p.historia ? `<p class="ficha-txt">${esc(p.historia)}</p>` : ''}
  ${at && p.specs.length ? `<table class="specs"><caption class="sr">Especificações de ${esc(rotulo(p))}</caption><tbody>${p.specs.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>` : ''}
  <div class="foot"><button class="btn ghost" data-act="fechar">Fechar</button></div>`;
}

/* ---------- vendas: lançar pedido ---------- */
function vNovoPedido(u) {
  const d = ui.pedido || (ui.pedido = novoPedidoVazio());
  const ativos = state.catalogo.produtos.filter(p => p.ativo);
  let total = 0;
  const linhas = d.itens.map((it, i) => { const p = prod(it.produto); const pr = p ? p.preco : 0; total += pr * (it.qtd || 0);
    return `<div class="row-line" style="grid-template-columns:minmax(0,2.2fr) 76px minmax(0,1fr) auto">
      <select class="inp" aria-label="Produto" data-chg="item-prod" data-i="${i}"><option value="">Escolha o produto</option>${state.catalogo.categorias.map(c => { const g = ativos.filter(a => a.cat === c.id); return g.length ? `<optgroup label="${esc(c.nome)}">${g.map(a => `<option value="${esc(a.id)}" ${a.id === it.produto ? 'selected' : ''}>${esc(rotulo(a))}${a.codigo ? ' · ' + esc(a.codigo) : ''}${a.preco > 0 ? '' : ' (sem preço)'}</option>`).join('')}</optgroup>` : ''; }).join('')}</select>
      <input class="inp" type="number" min="1" step="1" aria-label="Quantidade" data-chg="item-qtd" data-i="${i}" value="${esc(it.qtd)}">
      <span class="num" style="text-align:right;font-weight:600">${p ? (pr > 0 ? brl(pr * it.qtd) : 'A definir') : ''}</span>
      <button class="btn ghost sm" data-act="item-rem" data-i="${i}" aria-label="Remover item">×</button></div>`; }).join('');
  const comp = d.comprovante && state.arquivos[d.comprovante];
  return `<h1>Lançar pedido</h1><p class="sub">Registre a venda, escolha PIX ou boleto parcelado e acompanhe a expedição em Pedidos.</p>
  <div class="panel"><h2>Cliente</h2><div class="rows"><div class="grid2">
    <label class="field"><span>Nome ou razão social</span><input data-p="cliente.nome" value="${esc(d.cliente.nome)}"></label>
    <label class="field"><span>CPF ou CNPJ</span><input data-p="cliente.doc" inputmode="numeric" value="${esc(d.cliente.doc)}"></label></div>
    <label class="field"><span>Cidade e UF</span><input data-p="cliente.cidade" value="${esc(d.cliente.cidade)}"></label></div></div>
  <div class="panel"><h2>Itens</h2>
    <div class="rows">${linhas}<button class="btn ghost sm" style="justify-self:start" data-act="item-add">Adicionar item</button></div>
    <p style="text-align:right;margin:12px 0 0;font:italic 800 1.5rem/1 var(--f-ui)">Total ${brl(total)}</p></div>
  <div class="panel"><h2>Pagamento</h2>
    <div class="opts formas" role="radiogroup" aria-label="Forma de pagamento">
      <label class="opt${d.forma !== 'boleto' ? ' sel' : ''}"><input type="radio" name="fpag" id="fpPix" value="pix" data-act="forma-pag" ${d.forma !== 'boleto' ? 'checked' : ''}><span class="on"><b>PIX</b><small>O cliente paga e você anexa o comprovante.</small></span></label>
      <label class="opt${d.forma === 'boleto' ? ' sel' : ''}"><input type="radio" name="fpag" id="fpBoleto" value="boleto" data-act="forma-pag" ${d.forma === 'boleto' ? 'checked' : ''}><span class="on"><b>Boleto parcelado</b><small>Precisa da aprovação do financeiro antes de seguir para a expedição.</small></span></label>
    </div>
    ${d.forma === 'boleto' ? `<h3 class="sub3">Vencimento das parcelas, em dias depois do pedido</h3>
      <div class="dias" role="group" aria-label="Dias de vencimento">${BOLETO_DIAS.map(x => `<label class="dia${d.dias.includes(x) ? ' on' : ''}"><input type="checkbox" id="bd-${x}" data-act="boleto-dia" data-d="${x}" ${d.dias.includes(x) ? 'checked' : ''}>${x}</label>`).join('')}</div>
      ${d.dias.length ? `<div class="tbl-wrap" style="margin-top:10px"><table class="tbl" id="planoBoleto" style="min-width:0"><thead><tr><th>Parcela</th><th>Prazo</th><th>Vencimento</th><th class="num">Valor</th></tr></thead><tbody>
        ${planoBoleto(total, d.dias, hojeISO()).map(x => `<tr><td>${x.n} de ${x.de}</td><td>${x.dias} ${x.dias === 1 ? 'dia' : 'dias'}</td><td>${dataBR(x.vence)}</td><td class="num">${brl(x.valor)}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="note" style="margin:10px 0 0">Marque um dia para cada parcela. Exemplo: 30, 60 e 90 para três boletos.</p>'}`
    : comp ? `<ul class="files" style="margin-top:10px">${arqLi(comp.id, 'comp-rem')}</ul>` : `<p class="note" style="margin:10px 0 8px">Se o cliente já pagou, anexe o comprovante (imagem ou PDF). Também dá para anexar depois, no pedido.</p>
    <label tabindex="0" class="btn ghost sm">Anexar comprovante<input type="file" accept="image/*,application/pdf" hidden data-file="comp-novo"></label>`}</div>
  <label class="field"><span>Observações</span><textarea data-p="obs">${esc(d.obs)}</textarea></label>
  <div class="bar" style="margin-top:14px"><button class="btn" data-act="lancar-pedido">Lançar pedido</button><button class="btn ghost" data-act="limpar-pedido">Limpar</button></div>`;
}

/* ---------- vendas: pedidos, PIX e etiquetas ---------- */
function arqLi(id, remAct, extra = '') {
  const m = state.arquivos[id]; if (!m) return '';
  return `<li><span class="nm">${esc(m.nome)}</span><span class="mt">${kb(m.tamanho)}, ${dataBR(m.em)}${m.local ? ', será enviado ao gravar' : ''}</span>${extra}
    <button class="btn ghost sm" data-act="ver-arq" data-id="${esc(id)}">Ver</button><button class="btn ghost sm" data-act="baixar-arq" data-id="${esc(id)}">Baixar</button>
    ${remAct ? `<button class="btn danger sm" data-act="${remAct}" data-id="${esc(id)}" data-confirm="Confirmar">Remover</button>` : ''}</li>`;
}
function vPedidos(u) {
  const lj = u.papel === 'ecommerce', f = u.papel === 'admin' ? (ui.filtroPed || '') : '';
  const meus = state.pedidos.filter(p => u.papel === 'admin' || p.vendedor === u.id || (u.papel === 'vendedor' && respDe(p) === u.id));   // o vendedor acompanha os pedidos das lojas dele
  const lista = meus.filter(p => !f || (f === 'ecommerce' || f === 'site' ? p.origem === f : f === 'analise' ? paraConferir(p) : f === 'boleto' ? ehBoleto(p) : p.origem !== 'ecommerce' && p.origem !== 'site')).sort((a, b) => b.numero - a.numero);
  const vazio = lj ? 'Nenhum pedido ainda. Escolha os produtos, monte o carrinho e envie o comprovante do PIX.' : f ? 'Nenhum pedido neste filtro.' : 'Nenhum pedido ainda. Use "Lançar pedido" para registrar a primeira venda.';
  return `<h1>${lj || u.papel === 'representante' ? 'Meus pedidos' : 'Pedidos'}</h1><p class="sub">${u.papel === 'admin' ? 'Confira os comprovantes de PIX, aprove os boletos, baixe as etiquetas enviadas pelas lojas e libere a expedição.' : lj ? 'Acompanhe a conferência do PIX e a expedição. Abra um pedido para anexar mais etiquetas ou trocar o comprovante.' : u.papel === 'representante' ? 'Os pedidos que você lançou. Abra um pedido para acompanhar o pagamento e o envio.' : 'Seus pedidos e os das lojas de e-commerce que você atende. Abra um pedido para anexar o comprovante do PIX, ver a aprovação do boleto ou baixar a etiqueta.'}</p>
  ${u.papel === 'admin' ? `<div class="bar"><label class="sr" for="fp">Filtrar pedidos</label><select id="fp" class="inp" style="width:auto" data-chg="filtro-ped">${[['', 'Todos os pedidos'], ['analise', 'Pagamentos para conferir'], ['boleto', 'Boleto parcelado'], ['site', 'Loja do site (consumidor final)'], ['ecommerce', 'Vindos do e-commerce'], ['interno', 'Lançados por vendedores']].map(([k, t]) => `<option value="${k}" ${k === f ? 'selected' : ''}>${t}</option>`).join('')}</select></div>` : ''}
  ${lista.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Data</th>${lj ? '<th>Itens</th>' : '<th>Cliente</th>'}${u.papel === 'admin' ? '<th>Origem</th>' : ''}<th class="num">Total</th><th>Pagamento</th><th>Envio</th><th>Etiquetas</th><th></th></tr></thead><tbody>
  ${lista.map(p => `<tr><td><b>${p.numero}</b></td><td>${dataBR(p.criado)}</td>${lj ? `<td>${p.itens.map(i => `${i.qtd} × ${esc(i.nome)}`).join('<br>')}</td>` : `<td>${esc(p.cliente.nome)}<br><span class="note">${esc(p.cliente.cidade)}</span>${u.papel === 'vendedor' && p.vendedor !== u.id ? '<br>' + chip(['E-commerce', 'info']) : ''}</td>`}
    ${u.papel === 'admin' ? `<td>${p.origem === 'ecommerce' ? chip(['E-commerce', 'info']) : p.origem === 'site' ? chip(['Loja do site', 'ok']) : esc((user(p.vendedor) || {}).nome || '')}</td>` : ''}<td class="num">${brl(totalPedido(p))}</td>
    <td>${chipPag(p)}</td><td>${chip(ENVIO[p.envio])}</td><td>${p.etiquetas.length || '<span class="note">nenhuma</span>'}</td>
    <td><button class="btn ghost sm" data-act="abrir-pedido" data-id="${esc(p.id)}">Abrir</button></td></tr>`).join('')}
  </tbody></table></div>` : `<div class="empty">${vazio}</div>`}`;
}
function dPedido(p, u) {
  const adm = u.papel === 'admin', lj = p.origem === 'ecommerce', dono = p.vendedor === u.id, comp = p.pix.arquivo && state.arquivos[p.pix.arquivo];
  const et = ['aguardando', 'expedicao', 'enviado'], ix = et.indexOf(p.envio), unidades = p.itens.reduce((s, i) => s + i.qtd, 0);
  const pode = adm || dono, bol = ehBoleto(p), pg = p.pagamento || {};          // o vendedor responsável por uma loja só acompanha
  const repr = u.papel === 'representante';                                       // representante só faz o pedido: depois, só envia o comprovante que faltar
  const trocaComp = pode && (adm || (repr ? ['sem', 'recusado'].includes(p.pix.status) : p.pix.status !== 'verificado')), maisEtq = pode && !repr && (adm || p.envio !== 'enviado'), tiraEtq = adm || (dono && !repr && p.envio === 'aguardando');
  return `<h2 class="dt">Pedido nº ${p.numero}</h2>
  <p style="margin:0 0 14px"><b>${esc(p.cliente.nome)}</b>${p.cliente.doc ? ', ' + esc(p.cliente.doc) : ''}<br><span class="note">${esc(p.cliente.cidade)}${p.cliente.cidade ? '. ' : ''}${lj ? `Enviado pela Área do E-commerce em ${dataBR(p.criado)}, com os valores liberados para a loja.${respDe(p) ? ' Vendedor responsável: ' + esc((user(respDe(p)) || {}).nome || '') + '.' : ''}` : p.origem === 'site' ? `Comprado na loja do site em ${dataBR(p.criado)}, pela tabela + ${p.acrescimo == null ? 20 : p.acrescimo}%.` : `Lançado em ${dataBR(p.criado)} por ${esc((user(p.vendedor) || {}).nome || '')}.`}</span></p>
  ${p.origem === 'site' ? `<div class="panel"><h2>Entrega e contato</h2><p style="margin:0">${esc(enderecoTxt(p.cliente.endereco))}</p>
    <p class="note" style="margin:6px 0 0">${esc([p.cliente.fone, p.cliente.email].filter(Boolean).join(' · '))}</p>
    <p class="note" style="margin:6px 0 0">O frete não entra no total: combine com o cliente antes de enviar.</p></div>` : ''}
  <div class="tbl-wrap" style="margin-bottom:16px"><table class="tbl" style="min-width:0"><thead><tr><th>Item</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Subtotal</th></tr></thead><tbody>
    ${p.itens.map(i => `<tr><td>${esc(i.nome)}${i.codigo ? `<br><span class="note">${esc(i.codigo)}</span>` : ''}</td><td class="num">${i.qtd}</td><td class="num">${brl(i.preco)}</td><td class="num">${brl(i.qtd * i.preco)}</td></tr>`).join('')}
    <tr><td colspan="3" class="num"><b>Total</b></td><td class="num"><b>${brl(totalPedido(p))}</b></td></tr></tbody></table></div>
  ${p.obs ? `<p class="note">Observações: ${esc(p.obs)}</p>` : ''}
  ${bol ? `<div class="panel" id="painelBoleto"><h2>Boleto parcelado ${chip(BOLETO[pg.status])}</h2>
    <div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Parcela</th><th>Prazo</th><th>Vencimento</th><th class="num">Valor</th><th>${pg.status === 'aprovado' ? 'Recebida' : ''}</th></tr></thead><tbody>
      ${parcelasDe(p).map(x => `<tr><td>${x.n} de ${x.de}</td><td>${x.dias} ${x.dias === 1 ? 'dia' : 'dias'}</td><td>${dataBR(x.vence)}</td><td class="num">${brl(x.valor)}</td>
        <td>${pg.status !== 'aprovado' ? '' : adm ? `<input type="checkbox" class="toggle" data-act="parc-rec" data-id="${esc(p.id)}" data-d="${x.dias}" ${x.recebida ? 'checked' : ''} aria-label="Parcela ${x.n} recebida">` : chip(x.recebida ? ['Recebida', 'ok'] : ['Em aberto', ''])}</td></tr>`).join('')}</tbody></table></div>
    <p class="note" style="margin:8px 0 0">${pg.status === 'pendente' ? 'Aguardando a análise do financeiro. O pedido só segue para a expedição depois da aprovação.' : pg.status === 'aprovado' ? `Aprovado por ${esc((user(pg.por) || {}).nome || 'financeiro')} em ${dataBR(pg.em)}.` : `Recusado por ${esc((user(pg.por) || {}).nome || 'financeiro')} em ${dataBR(pg.em)}.${pg.motivo ? ' Motivo: ' + esc(pg.motivo) : ''}`}</p>
    ${adm ? `<label class="field" style="margin-top:10px"><span>Motivo, se for recusar (opcional)</span><input id="blMotivo" value=""></label>
      <div class="bar" style="margin:10px 0 0"><button class="btn sm" data-act="boleto-ok" ${pg.status === 'aprovado' ? 'disabled' : ''}>Aprovar boleto</button>
      <button class="btn danger sm" data-act="boleto-nao" ${pg.status === 'recusado' || p.envio !== 'aguardando' ? 'disabled' : ''}>Recusar boleto</button></div>`
    : dono && !repr && pg.status === 'recusado' ? `<div class="bar" style="margin:10px 0 0"><button class="btn sm" data-act="boleto-reabrir">Pedir nova análise</button><button class="btn ghost sm" data-act="boleto-para-pix">Trocar para PIX</button></div>` : ''}</div>`
  : `<div class="panel"><h2>Comprovante do PIX ${chip(PIX[p.pix.status])}</h2>
    ${comp ? `<ul class="files">${arqLi(comp.id)}</ul>` : `<p class="note" style="margin:0 0 8px">${p.pix.status === 'verificado' ? 'Pagamento conferido sem arquivo anexado.' : 'Nenhum comprovante enviado. Anexe a imagem ou o PDF do PIX deste pedido.'}</p>`}
    ${p.pix.status === 'recusado' && !adm ? '<p class="err" style="margin:8px 0 0">O comprovante foi recusado. Envie um novo para o pedido voltar à conferência.</p>' : ''}
    <div class="bar" style="margin:10px 0 0">${trocaComp ? `<label tabindex="0" class="btn ghost sm">${comp ? 'Substituir comprovante' : 'Anexar comprovante'}<input type="file" accept="image/*,application/pdf" hidden data-file="comp-pedido"></label>` : ''}
    ${adm ? `<button class="btn sm" data-act="pix-ok" ${p.pix.status === 'verificado' ? 'disabled' : ''}>Marcar como verificado</button><button class="btn danger sm" data-act="pix-nao" ${p.pix.status === 'sem' || p.pix.status === 'recusado' ? 'disabled' : ''}>Recusar comprovante</button>` : ''}</div>
    ${adm ? '' : '<p class="note" style="margin:8px 0 0">A conferência do PIX é feita pela administração da JCN.</p>'}</div>`}
  <div class="panel"><h2>Etiquetas de envio (PDF) ${p.etiquetas.length ? chip([p.etiquetas.length + (p.etiquetas.length > 1 ? ' arquivos' : ' arquivo'), 'ok']) : chip(['Faltam as etiquetas', 'warn'])}</h2>
    ${p.etiquetas.length ? `<ul class="files">${p.etiquetas.map(id => arqLi(id, tiraEtq ? 'etq-rem' : '')).join('')}</ul>` : `<p class="note" style="margin:0 0 8px">${lj && adm ? 'A loja ainda não enviou as etiquetas deste pedido.' : 'Nenhuma etiqueta anexada. Envie o PDF de cada volume.'}</p>`}
    <p class="note" style="margin:8px 0 0">Este pedido tem ${unidades} ${unidades > 1 ? 'unidades' : 'unidade'}.</p>
    ${maisEtq ? `<div class="bar" style="margin:10px 0 0"><label tabindex="0" class="btn ghost sm">Anexar etiquetas em PDF<input type="file" accept="application/pdf" multiple hidden data-file="etq-pedido"></label></div>` : ''}</div>
  <div class="panel"><h2>Expedição</h2><ol class="steps">${et.map((s, i) => `<li class="${i < ix ? 'done' : i === ix ? 'now' : ''}">${ENVIO[s][0]}</li>`).join('')}</ol>
    ${adm ? `<div class="bar" style="margin:0"><button class="btn sm" data-act="envio" data-s="expedicao" ${pagoOk(p) && p.envio === 'aguardando' ? '' : 'disabled'}>Liberar para expedição</button>
      <button class="btn sm" data-act="envio" data-s="enviado" ${p.envio === 'expedicao' && p.etiquetas.length ? '' : 'disabled'}>Marcar como enviado</button></div>
      <p class="note" style="margin:8px 0 0">A expedição só é liberada com o ${bol ? 'boleto aprovado' : 'PIX verificado'}, e o envio só é marcado com uma etiqueta anexada.</p>` : ''}</div>
  <div class="foot"><button class="btn ghost" data-act="fechar">Fechar</button></div>`;
}

/* ---------- usuários ---------- */
function vUsuarios() {
  return `<h1>Usuários</h1><p class="sub">Quem entra em cada portal. O perfil define o que a pessoa vê: administradores gerenciam tudo; vendedores lançam pedidos e cuidam das contas de e-commerce deles; representantes só lançam pedidos; lojas veem só os próprios pedidos.</p>
  ${ui.acesso && ui.acesso.usuario ? `<div class="acesso" role="status"><h2>Acesso de ${esc(ui.acesso.nome)}</h2>
    <p>Envie estes dados para a pessoa e peça que ela troque a senha no primeiro acesso (botão "Trocar senha"). A senha não aparece de novo depois que você sair desta tela.</p>
    <dl id="acDados"><div><dt>E-mail ou login</dt><dd>${esc(ui.acesso.login)}</dd></div><div><dt>Senha</dt><dd>${esc(ui.acesso.senha)}</dd></div></dl></div>` : ''}
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nome</th><th>E-mail ou login</th><th>Perfil</th><th>Empresa</th><th>Ativo</th><th></th></tr></thead><tbody>
  ${state.usuarios.map(u => `<tr><td><b>${esc(u.nome)}</b></td><td>${esc(u.papel === 'ecommerce' ? u.login : u.email || '')}</td><td>${chip([PAPEIS[u.papel], u.papel === 'admin' ? 'info' : ''])}</td><td>${esc(u.empresa)}</td>
    <td><input type="checkbox" class="toggle" data-act="toggle-user" data-id="${esc(u.id)}" ${u.ativo ? 'checked' : ''} ${u.id === sessao ? 'disabled' : ''} aria-label="${esc(u.nome)} ativo"></td>
    <td>${u.id === sessao ? '' : `<button class="btn ghost sm" data-act="user-senha" data-id="${esc(u.id)}" data-confirm="Confirmar: gerar senha nova">Nova senha</button>`}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="panel" style="margin-top:16px"><h2>Novo usuário</h2><div class="grid2">
    <label class="field"><span>Nome</span><input id="nuNome"></label><label class="field"><span>E-mail</span><input id="nuEmail" type="email"></label>
    <label class="field"><span>Perfil</span><select id="nuPapel">${Object.entries(PAPEIS).filter(([k]) => k !== 'ecommerce').map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
    <label class="field"><span>Empresa</span><input id="nuEmp" value="JCN Gourmet"></label>
    <label class="field"><span>Senha inicial</span><input id="nuSenha" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="mínimo de 8 caracteres"></label></div>
    <div class="bar" style="margin:10px 0 0"><button class="btn sm" data-act="user-add">Criar usuário</button><button class="btn ghost sm" data-act="user-gerar">Gerar senha</button></div>
    <p class="note" style="margin:8px 0 0">Você define a senha inicial e passa para a pessoa, que troca no primeiro acesso. As lojas de e-commerce são criadas em Contas e-commerce, com login, senha e produtos liberados.</p></div>`;
}

/* ---------- gaveta lateral e visualizador ---------- */
function renderDrawer() {
  const o = $('#overlay'), dr = ui.drawer, u = eu();
  if (!dr || (!u && !dr.pub)) { o.innerHTML = ''; return; }
  let html = '';
  if (dr.tipo === 'produto') html = dProduto(dr.draft);
  if (dr.tipo === 'pedido') { const p = state.pedidos.find(x => x.id === dr.id); if (!p) return fecharDrawer(); html = dPedido(p, u); }
  if (dr.tipo === 'linha') html = dLinha(dr.draft);
  if (dr.tipo === 'conta') html = dConta(dr.draft);
  if (dr.tipo === 'ficha') html = dFicha(dr, u);
  if (dr.tipo === 'sacola') html = dSacola();
  if (dr.tipo === 'senha') html = `<h2 class="dt">Trocar a minha senha</h2><div class="rows">
    <label class="field"><span>Senha nova</span><input id="msNova" type="password" autocomplete="new-password"></label>
    <label class="field"><span>Repita a senha nova</span><input id="msDeNovo" type="password" autocomplete="new-password"></label></div>
    <p class="err" role="alert" ${dr.erro ? '' : 'hidden'}>${esc(dr.erro || '')}</p>
    <div class="foot"><button class="btn" data-act="salvar-minha-senha">Trocar senha</button><button class="btn ghost" data-act="fechar">Cancelar</button></div>`;
  if (dr.tipo === 'pedido-site') { const p = (state.daqui || []).find(x => x.id === dr.id); if (!p) return fecharDrawer(); html = dPedidoSite(p, dr); }
  if (dr.tipo === 'meus-site') html = dMeusSite(dr);
  const sc = $('.drawer') ? $('.drawer').scrollTop : 0;
  o.innerHTML = `<div class="drawer-bg" data-act="fundo"><div class="drawer" role="dialog" aria-modal="true"><button class="x" data-act="fechar" aria-label="Fechar">×</button>${html}</div></div>`;
  $('.drawer').scrollTop = sc;
}
function fecharDrawer() { ui.drawer = null; $('#overlay').innerHTML = ''; }
function refresh() { renderApp(); renderDrawer(); }
function setPath(o, path, v) { const ks = path.split('.'); let t = o; for (let i = 0; i < ks.length - 1; i++) t = t[ks[i]]; t[ks[ks.length - 1]] = v; }
async function verArquivo(id) {
  const m = state.arquivos[id], f = await Files.get(id);
  if (!m || !f) return toast('Não foi possível abrir o arquivo agora. Tente de novo.');
  const v = document.createElement('div'); v.className = 'viewer';
  v.innerHTML = `<div class="vb"><b>${esc(m.nome)}</b><button class="btn sm" data-act="baixar-arq" data-id="${esc(id)}">Baixar</button><button class="btn ghost sm" style="color:#fff;border-color:#fff" data-act="fechar-viewer">Fechar</button></div>
    <div class="vc">${m.tipo.startsWith('image/') ? `<img src="${f.url}" alt="${esc(m.nome)}">` : `<iframe title="${esc(m.nome)}" src="${f.url}"></iframe>`}</div>`;
  document.body.appendChild(v);
}
async function baixarArquivo(id) {
  const m = state.arquivos[id], f = await Files.get(id);
  if (!m || !f) return toast('Não foi possível baixar o arquivo agora. Tente de novo.');
  { const a = document.createElement('a'); a.href = f.url; a.download = m.nome; document.body.appendChild(a); a.click(); a.remove(); }
}

/* ---------- ações ---------- */
function porNoPedido(id, q) {
  const d = ui.pedido || (ui.pedido = novoPedidoVazio()), vazio = d.itens.find(i => !i.produto), ja = d.itens.find(i => i.produto === id);
  if (ja) ja.qtd = Math.min(999, (+ja.qtd || 0) + q); else if (vazio) { vazio.produto = id; vazio.qtd = q; } else d.itens.push({ produto: id, qtd: q });
}
const pedidoAberto = () => ui.drawer && state.pedidos.find(p => p.id === ui.drawer.id);
const acts = {
  'abrir-login': e => abrirApp(e.dataset.portal),
  'voltar-site': voltarSite,
  'portal': e => { ui.portal = e.dataset.portal; ui.erro = ''; renderApp(); },
  'entrar': async e => {
    const ident = $('#lgEmail').value.trim().toLowerCase(), senha = $('#lgSenha').value, pt = ui.portal, loja = pt === 'ecommerce';
    if (!ident) ui.erro = loja ? 'Informe o login da sua loja.' : 'Informe o e-mail da sua conta.';
    else if (!senha) ui.erro = 'Informe a senha.';
    else {
      const b = $('[data-act=entrar]'); if (b) { b.disabled = true; b.textContent = 'Entrando…'; }
      try { const u = await API.entrar(ident, senha, pt); ligarRelogio(); return entrarComo(u); }
      catch (err) { ui.erro = err.rede ? err.message : /Invalid login|invalid_credentials|invalid_grant/i.test(err.message + ' ' + err.code) ? (loja ? 'Login' : 'E-mail') + ' ou senha incorretos. Se você esqueceu a senha, peça uma nova à JCN.' : /confirm/i.test(err.message) ? 'Este acesso ainda não foi confirmado. Fale com a administração da JCN.' : err.message; }
    }
    renderApp(); const i = $('#lgEmail'); if (i) i.value = ident;
  },
  'sair': async () => { ui.carrinho = null; ui.checkout = null; ui.acesso = null; ui.pedido = null; fecharDrawer(); try { await API.sair(); } catch (e) { sessao = null; } renderApp(); },
  'minha-senha': () => { ui.drawer = { tipo: 'senha', erro: '' }; renderDrawer(); },
  'salvar-minha-senha': async () => {
    const a = $('#msNova').value, b = $('#msDeNovo').value;
    if (a.length < 8) { ui.drawer.erro = 'Use pelo menos 8 caracteres.'; return renderDrawer(); }
    if (a !== b) { ui.drawer.erro = 'As duas senhas não estão iguais.'; return renderDrawer(); }
    try { await SB.trocarSenha(a); fecharDrawer(); toast('Senha trocada.'); } catch (err) { ui.drawer.erro = msgErro(err); renderDrawer(); }
  },
  'nav': e => { ui.view = e.dataset.view; ui.acesso = null; try { sessionStorage.setItem('jcn-tela', ui.view); } catch (err) { } renderApp(); scrollTo(0, 0); },
  'fechar': fecharDrawer,
  'fundo': (e, ev) => { if (ev.target === e) fecharDrawer(); },
  'fechar-viewer': () => { const v = $('.viewer'); if (v) v.remove(); },
  'ver-arq': e => verArquivo(e.dataset.id),
  'baixar-arq': e => baixarArquivo(e.dataset.id),
  // site
  'modelo': e => { ui.modelo = e.dataset.id; renderSite(); const b = $(`#rail [data-id="${e.dataset.id}"]`); if (b) b.focus(); },
  'ver-modelo': e => irParaModelo(e.dataset.id),
  // produtos
  'so-sem-preco': e => { ui.soSemPreco = e.checked; renderApp(); },
  'toggle-prod': e => { prod(e.dataset.id).ativo = e.checked; salvar('catalogo'); },
  'novo-produto': () => { ui.drawer = { tipo: 'produto', draft: { id: 'p-' + uid(), cat: ui.filtroCat || 'colors', nome: '', codigo: '', cor: '', hex: '#233B72', slogan: '', historia: '', specs: (ui.filtroCat || 'colors') === 'colors' ? Object.entries(SPEC_COLORS) : [['', '']], mostrar_preco: false, ativo: true, fotos: [], preco: 0, grupo: '', grelha: '', sub: '', fornos: [], par: '' } }; renderDrawer(); },
  'editar-produto': e => { const p = prod(e.dataset.id), par = p.grupo ? state.catalogo.produtos.find(x => x.grupo === p.grupo && x.id !== p.id) : null; ui.drawer = { tipo: 'produto', draft: { ...JSON.parse(JSON.stringify(p)), par: par ? par.id : '' } }; renderDrawer(); },
  'forno-serve': e => { const d = ui.drawer.draft, l = new Set(d.fornos || []); if (e.checked) l.add(e.dataset.id); else l.delete(e.dataset.id);
    d.fornos = state.catalogo.produtos.filter(x => l.has(x.id)).map(x => x.id); const n = d.fornos.length; $('#pdFornosN').textContent = n ? n + (n > 1 ? ' fornos' : ' forno') : 'nenhum'; },
  'spec-add': () => { ui.drawer.draft.specs.push(['', '']); renderDrawer(); },
  'spec-rem': e => { ui.drawer.draft.specs.splice(+e.dataset.i, 1); renderDrawer(); },
  'foto-rem': e => { ui.drawer.draft.fotos.splice(+e.dataset.i, 1); renderDrawer(); },
  'salvar-produto': () => {
    const d = ui.drawer.draft; d.nome = d.nome.trim();
    if (!d.nome) return toast('Dê um nome ao produto antes de salvar.');
    d.specs = d.specs.filter(s => s[0].trim() || s[1].trim());
    const par = d.grelha && d.par ? prod(d.par) : null;
    if (par && par.grelha === d.grelha) return toast('Os dois códigos estão com a mesma grelha. O par precisa ser um de ferro fundido e um de aço carbono.');
    delete d.par;
    d.grupo = '';
    if (par) {                                                          // par novo: quem fazia par com um dos dois fica sozinho
      const g = 'g-' + (d.grelha === 'ferro' ? d.id : par.id), velho = par.grupo;
      state.catalogo.produtos.forEach(p => { if (p.grupo && (p.grupo === g || p.grupo === velho)) p.grupo = ''; });
      d.grupo = par.grupo = g;
    }
    d.fornos = d.cat === 'fornosavulsos' ? [] : (d.fornos || []);
    const i = state.catalogo.produtos.findIndex(p => p.id === d.id);
    if (i >= 0) state.catalogo.produtos[i] = d; else state.catalogo.produtos.push(d);
    if (d.grupo) state.catalogo.produtos.forEach(p => { if (p.grupo === d.grupo && p.id !== d.id) p.fornos = d.fornos.slice(); });   // as duas grelhas são o mesmo fogão: mesmos fornos
    const n = {}; state.catalogo.produtos.forEach(p => { if (p.grupo) n[p.grupo] = (n[p.grupo] || 0) + 1; });
    state.catalogo.produtos.forEach(p => { if (p.grupo && n[p.grupo] !== 2) p.grupo = ''; });        // grupo é sempre um par
    salvar('catalogo'); fecharDrawer(); renderApp(); toast('Produto salvo.');
  },
  'remover-produto': () => { const id = ui.drawer.draft.id; state.catalogo.produtos = state.catalogo.produtos.filter(p => p.id !== id);
    state.catalogo.produtos.forEach(p => { if ((p.fornos || []).includes(id)) p.fornos = p.fornos.filter(x => x !== id); }); salvar('catalogo'); fecharDrawer(); renderApp(); toast('Produto removido.'); },
  // categorias e conteúdo
  'toggle-cat': e => { cat(e.dataset.id).ativa = e.checked; salvar('catalogo'); },
  'cat-rem': e => { state.catalogo.categorias = state.catalogo.categorias.filter(c => c.id !== e.dataset.id); salvar('catalogo'); renderApp(); },
  'cat-add': () => { const n = $('#novaCat').value.trim(); if (!n) return toast('Escreva o nome da categoria.'); state.catalogo.categorias.push({ id: 'c-' + uid(), nome: n, ativa: true }); salvar('catalogo'); renderApp(); },
  'linha': e => irParaLinha(+e.dataset.i),
  'toggle-linha': e => { state.conteudo.linhas.find(l => l.id === e.dataset.id).ativo = e.checked; salvar('conteudo'); },
  'linha-sobe': e => { const a = state.conteudo.linhas, i = a.findIndex(l => l.id === e.dataset.id); if (i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; salvar('conteudo'); renderApp(); } },
  'linha-desce': e => { const a = state.conteudo.linhas, i = a.findIndex(l => l.id === e.dataset.id); if (i >= 0 && i < a.length - 1) { [a[i + 1], a[i]] = [a[i], a[i + 1]]; salvar('conteudo'); renderApp(); } },
  'editar-linha': e => { ui.drawer = { tipo: 'linha', draft: JSON.parse(JSON.stringify(state.conteudo.linhas.find(l => l.id === e.dataset.id))) }; renderDrawer(); },
  'nova-linha': () => { ui.drawer = { tipo: 'linha', draft: { id: 'l-' + uid(), cat: state.catalogo.categorias[0].id, curto: '', titulo: '', texto: '', fatos: [['', ''], ['', ''], ['', '']], fotos: [], bancada: false, ativo: true } }; renderDrawer(); },
  'lfoto-rem': e => { ui.drawer.draft.fotos.splice(+e.dataset.i, 1); renderDrawer(); },
  'salvar-linha': () => {
    const d = ui.drawer.draft, a = state.conteudo.linhas; d.titulo = d.titulo.trim(); d.curto = d.curto.trim() || d.titulo;
    if (!d.titulo) return toast('Dê um título à linha antes de salvar.');
    while (d.fatos.length < 3) d.fatos.push(['', '']);
    const i = a.findIndex(l => l.id === d.id); if (i >= 0) a[i] = d; else a.push(d);
    salvar('conteudo'); fecharDrawer(); renderApp(); toast('Linha salva.');
  },
  'remover-linha': () => { const id = ui.drawer.draft.id; state.conteudo.linhas = state.conteudo.linhas.filter(l => l.id !== id); salvar('conteudo'); fecharDrawer(); renderApp(); toast('Linha removida.'); },
  'gal-rem': e => { state.conteudo.galeria.splice(+e.dataset.i, 1); salvar('conteudo'); renderApp(); },
  // catálogo e pedido
  'add-ao-pedido': e => {
    if (!(prod(e.dataset.id).preco > 0)) return toast('Este produto ainda não tem preço na tabela.');
    porNoPedido(e.dataset.id, 1); toast(prod(e.dataset.id).nome + ' adicionado ao pedido.');
  },
  // ficha do produto e escolha da grelha
  'ficha': e => { ui.drawer = { tipo: 'ficha', ids: e.dataset.ids.split(','), ctx: e.dataset.ctx, pub: e.dataset.ctx === 'site', sel: null, forno: '', qtd: 1 }; renderDrawer(); },
  'ficha-forno': e => { ui.drawer.forno = e.value; renderDrawer(); const r = $('#ff-' + CSS.escape(e.value || 'nenhum')); if (r) r.focus(); },
  'ficha-sel': e => { ui.drawer.sel = e.value; renderDrawer(); const r = $('#fx-' + CSS.escape(e.value)); if (r) r.focus(); },
  'fq': e => { const d = ui.drawer; d.qtd = Math.min(999, Math.max(1, (d.qtd || 1) + (+e.dataset.d))); $('#fq').value = d.qtd; },
  'ficha-add': () => {
    const d = ui.drawer, u = eu(), o = fichaOpcoes(d, u).find(x => x.p.id === d.sel); if (!o || !(o.preco > 0)) return;
    const q = d.qtd || 1, nome = rotulo(o.p);
    const fo = d.forno ? fornosDe(o.p, d.ctx, u).find(f => f.p.id === d.forno) : null;       // um forno para cada fogão
    const itens = fo ? [o.p.id, fo.p.id] : [o.p.id];
    if (d.ctx === 'loja') { const c = carrinho(); itens.forEach(id => { c[id] = Math.min(999, (c[id] || 0) + q); }); guardarCarrinho(); }
    else if (d.ctx === 'site') { const c = sacola(); itens.forEach(id => { c[id] = Math.min(999, (c[id] || 0) + q); }); guardarSacola(); }
    else itens.forEach(id => porNoPedido(id, q));
    fecharDrawer(); if (d.ctx === 'site') renderVitrine(); else renderApp();
    toast(`${q} × ${nome}${fo ? ` + ${q} × ${fo.p.nome}` : ''} ${(ONDE[d.ctx] || ONDE.venda)[1]}.`);
  },
  'item-add': () => { ui.pedido.itens.push({ produto: '', qtd: 1 }); renderApp(); },
  'item-rem': e => { ui.pedido.itens.splice(+e.dataset.i, 1); if (!ui.pedido.itens.length) ui.pedido.itens.push({ produto: '', qtd: 1 }); renderApp(); },
  'comp-rem': () => { Files.remove(ui.pedido.comprovante); ui.pedido.comprovante = null; renderApp(); },
  'limpar-pedido': () => { ui.pedido = novoPedidoVazio(); renderApp(); },
  'lancar-pedido': async () => {
    const d = ui.pedido, u = eu(), itens = d.itens.filter(i => i.produto && i.qtd > 0);
    if (!d.cliente.nome.trim()) return toast('Informe o nome do cliente.');
    if (!itens.length) return toast('Escolha pelo menos um produto.');
    const sem = itens.map(i => prod(i.produto)).find(p => !(p.preco > 0));
    if (sem) return toast(`${rotulo(sem)} ainda não tem preço na tabela. Cadastre o preço em Produtos ou tire o item do pedido.`);
    const boleto = d.forma === 'boleto', dias = BOLETO_DIAS.filter(x => (d.dias || []).includes(x));
    if (boleto && !dias.length) return toast('Marque o vencimento de pelo menos uma parcela do boleto.');
    if (ui.ocupado) return; ui.ocupado = true;
    const bt = $('[data-act=lancar-pedido]'); if (bt) { bt.disabled = true; bt.textContent = 'Gravando…'; }
    try {
      const r = await API.lancarPedido({ origem: 'interno', cliente: { nome: d.cliente.nome.trim(), doc: d.cliente.doc.trim(), cidade: d.cliente.cidade.trim() }, obs: d.obs.trim(), forma: boleto ? 'boleto' : 'pix', dias,
        itens: itens.map(i => ({ produto: i.produto, qtd: +i.qtd, preco: prod(i.produto).preco })), comprovante: boleto ? null : d.comprovante });
      if (boleto && d.comprovante) Files.remove(d.comprovante);
      ui.pedido = null; ui.view = 'pedidos'; renderApp(); scrollTo(0, 0);
      toast('Pedido nº ' + r.numero + (boleto ? ' lançado. O boleto aguarda a aprovação do financeiro.' : r.falhas.length ? ' lançado, mas o comprovante não subiu. Abra o pedido e anexe de novo.' : ' lançado.'));
    } catch (err) { toast(msgErro(err)); if (bt) { bt.disabled = false; bt.textContent = 'Lançar pedido'; } }
    finally { ui.ocupado = false; }
  },
  'abrir-pedido': e => { ui.drawer = { tipo: 'pedido', id: e.dataset.id }; renderDrawer(); },
  // boleto parcelado
  'forma-pag': e => { ui.pedido.forma = e.value; renderApp(); const r = $(e.value === 'boleto' ? '#fpBoleto' : '#fpPix'); if (r) r.focus(); },
  'boleto-dia': e => { const d = ui.pedido, x = +e.dataset.d; d.dias = BOLETO_DIAS.filter(k => k === x ? e.checked : d.dias.includes(k)); renderApp(); const c = $('#bd-' + x); if (c) c.focus(); },
  'boleto-ok': () => { const p = pedidoAberto(); if (!p || !ehBoleto(p) || eu().papel !== 'admin') return; Object.assign(p.pagamento, { status: 'aprovado', por: sessao, em: hojeISO(), motivo: '' }); salvar('pedidos'); refresh(); toast('Boleto aprovado. O pedido já pode seguir para a expedição.'); },
  'boleto-nao': () => { const p = pedidoAberto(); if (!p || !ehBoleto(p) || eu().papel !== 'admin' || p.envio !== 'aguardando') return; Object.assign(p.pagamento, { status: 'recusado', por: sessao, em: hojeISO(), motivo: ($('#blMotivo') || {}).value || '', recebidas: [] }); salvar('pedidos'); refresh(); toast('Boleto recusado. O vendedor vê o motivo no pedido.'); },
  'boleto-reabrir': () => { const p = pedidoAberto(); if (!p || !ehBoleto(p) || p.pagamento.status !== 'recusado' || eu().papel === 'representante') return; p.pagamento.status = 'pendente'; salvar('pedidos'); refresh(); toast('Pedido enviado de novo para o financeiro.'); },
  'boleto-para-pix': () => { const p = pedidoAberto(); if (!p || !ehBoleto(p) || p.pagamento.status === 'aprovado' || eu().papel === 'representante') return; p.pagamento = { forma: 'pix' }; p.pix = { status: 'sem', arquivo: null }; salvar('pedidos'); refresh(); toast('Pagamento trocado para PIX. Anexe o comprovante.'); },
  'parc-rec': e => { const p = state.pedidos.find(x => x.id === e.dataset.id); if (!p || !ehBoleto(p) || p.pagamento.status !== 'aprovado' || eu().papel !== 'admin') return; const d = +e.dataset.d, r = new Set(p.pagamento.recebidas || []); if (e.checked) r.add(d); else r.delete(d); p.pagamento.recebidas = [...r]; salvar('pedidos'); refresh(); toast(e.checked ? `Parcela de ${d} ${d === 1 ? 'dia' : 'dias'} do pedido nº ${p.numero} marcada como recebida. Para desfazer, abra o pedido.` : 'Parcela voltou para em aberto.'); },
  'pix-ok': () => { const p = pedidoAberto(); p.pix.status = 'verificado'; p.pix.por = sessao; salvar('pedidos'); refresh(); toast('PIX marcado como verificado.'); },
  'pix-nao': () => { const p = pedidoAberto(); p.pix.status = 'recusado'; p.pix.por = sessao; if (p.envio === 'expedicao') p.envio = 'aguardando'; salvar('pedidos'); refresh(); toast('Comprovante recusado.'); },
  'etq-rem': e => { const p = pedidoAberto(); p.etiquetas = p.etiquetas.filter(x => x !== e.dataset.id); Files.remove(e.dataset.id); salvar('pedidos'); refresh(); },
  'envio': e => { const p = pedidoAberto(); p.envio = e.dataset.s; salvar('pedidos'); refresh(); toast(e.dataset.s === 'enviado' ? 'Pedido marcado como enviado.' : 'Pedido liberado para expedição.'); },
  // usuários
  'toggle-user': e => { const eux = eu(), x = user(e.dataset.id); if (!x || !(eux.papel === 'admin' || (eux.papel === 'vendedor' && x.papel === 'ecommerce' && x.vendedorResp === eux.id))) { e.checked = !e.checked; return; } x.ativo = e.checked; salvar('usuarios'); },
  'user-gerar': () => { $('#nuSenha').value = gerarSenha(); },
  'user-add': async () => {
    if (eu().papel !== 'admin' || ui.ocupado) return;
    const nome = $('#nuNome').value.trim(), email = $('#nuEmail').value.trim().toLowerCase(), papel = $('#nuPapel').value, senha = $('#nuSenha').value, empresa = $('#nuEmp').value.trim();
    if (!nome || !/^\S+@\S+\.\S+$/.test(email)) return toast('Informe nome e um e-mail válido.');
    if (senha.length < 8) return toast('Defina uma senha inicial com pelo menos 8 caracteres, ou use "Gerar senha".');
    if (state.usuarios.some(u => (u.email || '').toLowerCase() === email)) return toast('Já existe um usuário com este e-mail.');
    ui.ocupado = true;
    try { await API.criarAcesso({ email, senha, perfil: { nome, papel, empresa: empresa || null, ativo: true } }); ui.acesso = { nome, login: email, senha, usuario: true }; renderApp(); toast('Usuário criado. Envie o e-mail e a senha para a pessoa.'); }
    catch (err) { toast(msgErro(err)); } finally { ui.ocupado = false; }
  },
  'user-senha': async e => {
    const id = e.dataset.id, s = gerarSenha(), u = user(id); if (eu().papel !== 'admin' || !u) return;
    try { await API.definirSenha(id, s); ui.acesso = { nome: u.nome, login: u.papel === 'ecommerce' ? u.login : u.email, senha: s, usuario: true }; renderApp(); scrollTo(0, 0); toast('Senha nova definida.'); } catch (err) { toast(msgErro(err)); }
  }
};
const chgs = {
  'filtro-cat': e => { ui.filtroCat = e.value; renderApp(); },
  'filtro-ped': e => { ui.filtroPed = e.value; renderApp(); },
  'filtro-venda': e => { ui.catVenda = e.value; renderApp(); },
  'busca-prod': e => { ui.buscaProd = e.value; renderApp(); },
  'cat-nome': e => { const c = cat(e.dataset.id), v = e.value.trim(); if (v) { c.nome = v; salvar('catalogo'); } else e.value = c.nome; },
  'conteudo': e => { state.conteudo[e.dataset.k] = e.value; salvar('conteudo'); },
  'item-prod': e => { ui.pedido.itens[+e.dataset.i].produto = e.value; renderApp(); },
  'item-qtd': e => { ui.pedido.itens[+e.dataset.i].qtd = Math.max(1, parseInt(e.value, 10) || 1); renderApp(); },
  'busca-venda': e => { ui.buscaVenda = e.value; renderApp(); },
  'ficha-qtd': e => { ui.drawer.qtd = Math.min(999, Math.max(1, parseInt(e.value, 10) || 1)); e.value = ui.drawer.qtd; }
};
const ehPDF = f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '');
const PDF_IMG = f => ehPDF(f) || f.type.startsWith('image/');
const uploads = {
  'foto-produto': async f => { const m = await Files.put(f, { imagem: true }); ui.drawer.draft.fotos.push('file:' + m.id); renderDrawer(); },
  'foto-linha': async f => { const m = await Files.put(f, { imagem: true }); ui.drawer.draft.fotos.push('file:' + m.id); renderDrawer(); },
  'foto-galeria': async f => { const m = await Files.put(f, { imagem: true }); state.conteudo.galeria.push('file:' + m.id); salvar('conteudo'); renderApp(); },
  'comp-novo': async f => { if (!PDF_IMG(f)) return toast('Envie o comprovante em imagem ou PDF.'); const m = await Files.put(f); ui.pedido.comprovante = m.id; renderApp(); },
  'comp-pedido': async f => { if (!PDF_IMG(f)) return toast('Envie o comprovante em imagem ou PDF.'); const m = await Files.put(f), p = pedidoAberto(); if (!p) return; if (p.pix.arquivo) Files.remove(p.pix.arquivo); p.pix = { status: 'analise', arquivo: m.id }; salvar('pedidos'); refresh(); toast('Comprovante enviado para conferência.'); },
  'etq-pedido': async f => { if (eu().papel === 'representante') return; if (!ehPDF(f)) return toast('A etiqueta precisa ser um arquivo PDF.'); const m = await Files.put(f), p = pedidoAberto(); if (!p) return; p.etiquetas.push(m.id); salvar('pedidos'); refresh(); toast('Etiqueta anexada.'); }
};

document.addEventListener('click', ev => {
  const j = ev.target.closest('a[data-jump]');
  if (j) { ev.preventDefault(); const st = $('.stage'); scrollTo({ top: st.offsetTop + (st.offsetHeight - innerHeight) * parseFloat(j.dataset.jump), behavior: 'auto' }); return; }
  const h = ev.target.closest('a[href^="#"]');
  if (h && h.getAttribute('href').length > 1) { const alvoEl = document.getElementById(h.getAttribute('href').slice(1)); if (alvoEl) { ev.preventDefault(); alvoEl.scrollIntoView(); } return; }
  const e = ev.target.closest('[data-act]'); if (!e || e.disabled) return;
  if (e.dataset.act === 'fundo' && ev.target !== e) return;
  if (e.dataset.confirm && !e.dataset.armado) { e.dataset.armado = '1'; e.textContent = e.dataset.confirm; return; }
  const fn = acts[e.dataset.act]; if (!fn) return;
  const rodar = () => { const r = fn(e, ev); if (r && r.catch) r.catch(() => toast('Não foi possível concluir. Tente de novo.')); };
  if (ocupados) quandoLivre().then(rodar); else rodar();          // se uma gravação está em curso, o clique espera por ela
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.matches('[data-file]')) {                                    // um arquivo por vez, em ordem (etiquetas aceitam vários)
    const fs = [...(t.files || [])], fn = uploads[t.dataset.file]; t.value = '';
    if (fs.length && fn) (async () => { for (const f of fs) { await quandoLivre(); await fn(f, t); } })().catch(err => toast(err && /imagem|10 MB/.test(err.message || '') ? err.message : 'Não foi possível ler o arquivo. Tente outro.'));
    return;
  }
  if (t.dataset.chg && chgs[t.dataset.chg]) { if (ocupados) quandoLivre().then(() => chgs[t.dataset.chg](t)); else chgs[t.dataset.chg](t); }
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset.f && ui.drawer && ui.drawer.draft) setPath(ui.drawer.draft, t.dataset.f, t.type === 'checkbox' ? t.checked : 'num' in t.dataset ? (parseFloat(t.value) || 0) : t.value);
  if (t.dataset.p && ui.pedido) setPath(ui.pedido, t.dataset.p, t.value);
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') { if ($('.viewer')) $('.viewer').remove(); else if (ui.drawer) fecharDrawer(); }
  if (ev.key === 'Enter' && ev.target.matches('#lgEmail,#lgSenha')) acts.entrar();
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('label.btn')) { ev.preventDefault(); const i = $('input[type=file]', ev.target); if (i) i.click(); }
});


/* =====================================================================
   E-COMMERCE
   O administrador cria o login e a senha de cada loja e libera produtos
   e valores. A loja entra, monta o carrinho, paga por PIX e envia o
   comprovante e as etiquetas em PDF. O pedido cai em Pedidos do admin.
   A senha fica só no servidor de login (Supabase Auth), nunca no navegador. Em produção
   o login é do Supabase Auth e as regras estão no schema.sql.
   ===================================================================== */
const ALFA = 'abcdefghjkmnpqrstuvwxyz23456789';                       // sem 0/o, 1/l/i: fácil de ditar
function gerarSenha(n = 10) {
  const a = new Uint32Array(n);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 4294967296);
  return [...a].map(x => ALFA[x % ALFA.length]).join('');
}
const lojas = () => state.usuarios.filter(u => u.papel === 'ecommerce');
const dinheiro = n => Math.round(+((Number(n) || 0) * 100).toFixed(4)) / 100;   // 676,90 × 0,95 dá 643,0549999 na conta do computador: arredonda como no papel (643,06)
const vendaveis = () => state.catalogo.produtos.filter(p => p.ativo && (cat(p.cat) || {}).ativa);
/* o que a loja enxerga: só o que o administrador liberou, pelo valor que ele definiu */
function liberadosDe(u) { const l = u.liberados || {}; return vendaveis().filter(p => l[p.id] > 0).map(p => ({ p, preco: l[p.id] })); }
function carrinho() {
  const u = eu(); if (!u) return {};
  if (!ui.carrinho) { ui.carrinho = {}; try { ui.carrinho = JSON.parse(localStorage.getItem('jcn-carrinho-' + u.id)) || {}; } catch (e) { ui.carrinho = {}; } }
  return ui.carrinho;
}
function guardarCarrinho() { const u = eu(); try { localStorage.setItem('jcn-carrinho-' + u.id, JSON.stringify(ui.carrinho || {})); } catch (e) { } }
function itensCarrinho(u) { const c = carrinho(); return liberadosDe(u).filter(x => c[x.p.id] > 0).map(x => ({ ...x, qtd: c[x.p.id] })); }
function qtdCarrinho() { const u = eu(); return u && u.papel === 'ecommerce' ? itensCarrinho(u).reduce((s, i) => s + i.qtd, 0) : 0; }
const checkout = () => ui.checkout || (ui.checkout = { comprovante: null, etiquetas: [], obs: '' });
const fotoProd = (p, alt = '') => p.fotos[0] ? `<img loading="lazy" src="${src(p.fotos[0])}" alt="${esc(alt)}">` : '';

/* ---------- administrador: contas e-commerce ---------- */
// administrador cuida de todas as contas; o vendedor, só das lojas dele. Representante não mexe em contas.
const podeConta = (u, loja) => !!u && (u.papel === 'admin' || (u.papel === 'vendedor' && (!loja || loja.vendedorResp === u.id)));
function vLojas(eux) {
  const adm = eux.papel === 'admin', ls = lojas().filter(l => adm || l.vendedorResp === eux.id), px = state.conteudo.pix, ac = ui.acesso;
  return `<h1>${adm ? 'Contas e-commerce' : 'Minhas contas e-commerce'}</h1><p class="sub">${adm ? 'Crie o login e a senha de cada loja, diga de qual vendedor ela é e escolha quais produtos ela enxerga e por quanto.' : 'Crie o login e a senha das suas lojas e escolha quais produtos cada uma enxerga e por quanto. As lojas que você cria ficam no seu nome.'} A loja entra pela aba E-commerce, monta o carrinho e envia o comprovante do PIX e as etiquetas em PDF.</p>
  ${ac ? `<div class="acesso" role="status"><h2>Acesso de ${esc(ac.nome)}</h2>
    <p>Envie estes dados para a loja. A senha não aparece de novo depois que você sair desta tela; se precisar, defina outra em Editar.</p>
    <dl id="acDados"><div><dt>Login</dt><dd>${esc(ac.login)}</dd></div><div><dt>Senha</dt><dd>${esc(ac.senha)}</dd></div></dl>
    <button class="btn sm" data-act="copiar-acesso">Copiar login e senha</button></div>` : ''}
  <div class="bar"><span class="grow"></span><button class="btn" data-act="nova-conta">Criar conta</button></div>
  ${ls.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Loja</th><th>Login</th>${adm ? '<th>Vendedor</th>' : ''}<th class="num">Produtos liberados</th><th class="num">Pedidos</th><th>Ativa</th><th></th></tr></thead><tbody>
  ${ls.map(u => { const n = liberadosDe(u).length, np = state.pedidos.filter(p => p.vendedor === u.id).length; return `<tr>
    <td><b>${esc(u.nome)}</b><br><span class="note">${esc([u.cidade, u.contato].filter(Boolean).join(' · ')) || 'sem contato cadastrado'}</span></td>
    <td>${esc(u.login)}${u.senha ? '' : '<br><span class="note">demonstração, entra sem senha</span>'}</td>
    ${adm ? `<td>${u.vendedorResp && user(u.vendedorResp) ? esc(user(u.vendedorResp).nome) : '<span class="chip warn">definir</span>'}</td>` : ''}
    <td class="num">${n ? n : '<span class="chip warn">nenhum</span>'}</td><td class="num">${np}</td>
    <td><input type="checkbox" class="toggle" data-act="toggle-user" data-id="${esc(u.id)}" ${u.ativo ? 'checked' : ''} aria-label="${esc(u.nome)} ativa"></td>
    <td><button class="btn ghost sm" data-act="editar-conta" data-id="${esc(u.id)}">Editar</button></td></tr>`; }).join('')}
  </tbody></table></div>` : `<div class="empty">${adm ? 'Nenhuma conta de e-commerce.' : 'Você ainda não tem contas de e-commerce.'} Crie a primeira para liberar produtos e valores a uma loja.</div>`}
  ${!adm ? '' : `<div class="panel" style="margin-top:16px"><h2>PIX para recebimento</h2>
    <p class="note" style="margin:0 0 10px">Esta chave aparece no carrinho de todas as lojas, na hora de pagar.</p>
    <div class="grid3"><label class="field"><span>Chave PIX</span><input id="pxChave" data-chg="pix-cfg" data-k="chave" value="${esc(px.chave)}" placeholder="CNPJ, e-mail, telefone ou chave aleatória"></label>
      <label class="field"><span>Favorecido</span><input id="pxFav" data-chg="pix-cfg" data-k="favorecido" value="${esc(px.favorecido)}"></label>
      <label class="field"><span>Banco</span><input id="pxBanco" data-chg="pix-cfg" data-k="banco" value="${esc(px.banco)}"></label></div></div>`}`;
}
function precoBase(p) { return dinheiro((p.preco || 0) * (1 - (ui.drawer.desc || 0) / 100)); }   // tabela JCN menos o desconto da loja
// "liberar" em lote só alcança o que já tem preço na tabela; o resto fica para definir à mão
function liberarLista(lista) {
  const d = ui.drawer.draft; let fora = 0;
  lista.forEach(p => { const v = precoBase(p); if (v > 0) d.liberados[p.id] = v; else if (d.liberados[p.id] == null) fora++; });
  renderDrawer();
  if (fora) toast(`${fora} ${fora > 1 ? 'produtos ficaram' : 'produto ficou'} de fora por não ter preço na tabela. Marque e digite o valor, ou cadastre o preço em Produtos.`);
}
function dConta(d) {
  const nova = !user(d.id), dr = ui.drawer, ps = vendaveis(), n = ps.filter(p => d.liberados[p.id] != null).length;
  const porCat = state.catalogo.categorias.map(c => [c, ps.filter(p => p.cat === c.id)]).filter(x => x[1].length);
  return `<h2 class="dt">${nova ? 'Nova conta e-commerce' : 'Editar ' + esc(d.nome)}</h2>
  <div class="rows">
    <div class="grid2"><label class="field"><span>Nome da loja</span><input id="ctNome" data-f="nome" value="${esc(d.nome)}"></label><label class="field"><span>CNPJ ou CPF</span><input id="ctDoc" data-f="doc" inputmode="numeric" value="${esc(d.doc)}"></label></div>
    <div class="grid2"><label class="field"><span>Cidade e UF</span><input id="ctCidade" data-f="cidade" value="${esc(d.cidade)}"></label><label class="field"><span>Contato (responsável e telefone)</span><input id="ctContato" data-f="contato" value="${esc(d.contato)}"></label></div>
    ${eu().papel === 'vendedor' ? `<p class="note" id="ctVendFixo" style="margin:0">Vendedor desta loja: <b>${esc(eu().nome)}</b> (você). Os pedidos dela aparecem em Pedidos, e as vendas entram para você no Financeiro da JCN.</p>` : `<label class="field"><span>De qual vendedor é este e-commerce?</span><select id="ctVend" data-f="vendedorResp"><option value="">Escolha o vendedor</option>${vendedores().filter(v => v.ativo || v.id === d.vendedorResp).map(v => `<option value="${esc(v.id)}" ${v.id === d.vendedorResp ? 'selected' : ''}>${esc(v.nome)}${v.ativo ? '' : ' (inativo)'}</option>`).join('')}</select></label>
    <p class="note" style="margin:-2px 0 0">${vendedores().some(v => v.ativo) ? 'O vendedor acompanha os pedidos desta loja, e as vendas dela entram para ele no Financeiro.' : 'Ainda não há vendedor ativo. Cadastre um em Usuários antes de criar a conta.'}</p>`}
  </div>
  <div class="panel" style="margin-top:16px"><h2>Acesso</h2>
    <div class="grid2"><label class="field"><span>Login</span><input id="ctLogin" data-f="login" autocapitalize="none" spellcheck="false" value="${esc(d.login)}" placeholder="ex.: lojadaana"></label>
      <label class="field"><span>${nova || !d.senha ? 'Senha' : 'Nova senha'}</span><input id="ctSenha" data-f="senhaNova" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(d.senhaNova)}" placeholder="${nova || !d.senha ? 'mínimo de 8 caracteres' : 'em branco mantém a atual'}"></label></div>
    <div class="bar" style="margin:10px 0 0"><button class="btn ghost sm" data-act="conta-gerar">Gerar senha</button>
      <span class="note">${!nova && !d.senha ? 'Conta de demonstração: sem senha ela entra direto. Ao definir uma senha, passa a exigi-la.' : 'Depois de salvar, a tela mostra o login e a senha para você enviar à loja.'}</span></div></div>
  <div class="panel"><h2>Produtos e valores <span class="chip ${n ? 'ok' : 'warn'}">${n} de ${ps.length} liberados</span></h2>
    <p class="note" style="margin:0 0 10px">Marque o que a loja pode comprar e defina o valor de cada item. O que não estiver marcado não aparece para ela. Nos fogões com duas grelhas, cada grelha é um código: libere uma ou as duas.</p>
    <div class="bar"><label class="field inl"><span>Desconto sobre a tabela JCN, em %</span><input id="ctDesc" class="inp" style="width:5.2rem" type="number" min="0" max="90" step="0.5" inputmode="decimal" data-chg="conta-desc" value="${esc(dr.desc)}"></label></div>
    <div class="bar"><button class="btn ghost sm" data-act="lib-todos">Liberar todos pela tabela</button><button class="btn ghost sm" data-act="lib-colors">Só a Linha Colors</button><button class="btn ghost sm" data-act="lib-limpar">Limpar</button></div>
    ${(() => { const fg = ps.filter(p => d.liberados[p.id] != null && (p.fornos || []).length); return fg.length && !fg.some(p => p.fornos.some(id => d.liberados[id] != null))
      ? `<p class="note" id="avisoForno" style="margin:0 0 10px">Esta loja tem fogões que aceitam forno, mas nenhum forno avulso liberado, então ela não verá a opção de forno. Para oferecer, libere a categoria Fornos avulsos.</p>` : ''; })()}
    <div class="tbl-wrap"><table class="tbl lib" style="min-width:0"><thead><tr><th><span class="sr">Liberar</span></th><th>Produto</th><th class="num">Tabela JCN</th><th class="num">Valor para a loja (R$)</th></tr></thead><tbody>
    ${porCat.map(([c, lista]) => `<tr class="grp"><th colspan="4" scope="colgroup"><span>${esc(c.nome)}</span><button class="btn ghost sm" data-act="lib-cat" data-id="${esc(c.id)}">Liberar a categoria</button></th></tr>` + lista.map(p => { const on = d.liberados[p.id] != null; return `<tr>
      <td><input type="checkbox" id="lb-${esc(p.id)}" data-act="lib" data-id="${esc(p.id)}" ${on ? 'checked' : ''} aria-label="Liberar ${esc(rotulo(p))}"></td>
      <td><label for="lb-${esc(p.id)}"><b>${esc(p.nome)}</b><br><span class="note">${p.grelha ? '' : `<i class="sw" style="background:${esc(p.hex)}"></i>`}${esc(detalhe(p))}${p.codigo ? ' · ' + esc(p.codigo) : ''}</span></label></td>
      <td class="num note">${precoTxt(p.preco)}</td>
      <td class="num"><input class="inp preco" id="pv-${esc(p.id)}" type="number" min="0" step="0.01" inputmode="decimal" aria-label="Valor de ${esc(rotulo(p))} para a loja" data-f="liberados.${esc(p.id)}" data-num value="${on ? esc(d.liberados[p.id]) : ''}" ${on ? '' : 'disabled'}></td></tr>`; }).join('')).join('')}
    </tbody></table></div></div>
  <label class="check"><input type="checkbox" id="ctAtivo" data-f="ativo" ${d.ativo ? 'checked' : ''}>Conta ativa (pode entrar e fazer pedidos)</label>
  <div class="foot"><button class="btn" data-act="salvar-conta">Salvar conta</button><button class="btn ghost" data-act="fechar">Cancelar</button></div>`;
}

/* ---------- loja: produtos liberados ---------- */
function vLoja(u) {
  const todos = liberadosDe(u), c = carrinho(), cats = [...new Set(todos.map(x => x.p.cat))], q = (ui.buscaLoja || '').trim().toLowerCase();
  if (!cats.includes(ui.catLoja)) ui.catLoja = '';
  const achados = todos.filter(x => (!ui.catLoja || x.p.cat === ui.catLoja) && (!q || (x.p.nome + ' ' + x.p.codigo + ' ' + detalhe(x.p)).toLowerCase().includes(q))), n = qtdCarrinho();
  const gs = new Set(achados.map(x => x.p.grupo).filter(Boolean)), lista = todos.filter(x => achados.includes(x) || gs.has(x.p.grupo));
  return `<h1>Produtos</h1><p class="sub">Produtos e valores liberados pela JCN Gourmet para ${esc(u.nome)}. Abra um produto para ver a ficha; nos fogões com duas grelhas, você escolhe entre ferro fundido e aço carbono, e pode incluir o forno, que é opcional.</p>
  ${todos.length ? `<div class="bar">${cats.length > 1 ? `<label class="sr" for="fl">Categoria</label><select id="fl" class="inp" style="width:auto" data-chg="filtro-loja"><option value="">Todas as categorias</option>${cats.map(k => `<option value="${esc(k)}" ${k === ui.catLoja ? 'selected' : ''}>${esc((cat(k) || {}).nome || '')}</option>`).join('')}</select>` : ''}
    ${todos.length > 12 ? `<label class="sr" for="bl">Buscar</label><input id="bl" class="inp" style="width:min(16rem,100%)" type="search" placeholder="Buscar por nome ou código" data-chg="busca-loja" value="${esc(ui.buscaLoja || '')}">` : ''}
    <span class="grow"></span><button class="btn" data-act="nav" data-view="carrinho">${n ? `Ver carrinho (${n})` : 'Carrinho vazio'}</button></div>
  ${lista.length ? `<div class="cards shop">${modelos(lista).map(g => { const { p, preco } = g[0], varias = g.length > 1, ids = g.map(x => x.p.id).join(','), no = g.reduce((s, x) => s + (c[x.p.id] || 0), 0), fo = fornosDe(p, 'loja', u).length;
    return `<div class="card">
    <button class="ph" data-act="ficha" data-ids="${esc(ids)}" data-ctx="loja" aria-label="Abrir ${esc(p.nome)}">${fotoDe(p, `${p.nome}, ${detalhe(p)}`)}</button>
    <h3>${esc(p.nome)}</h3><span class="note">${varias ? g.map(x => `${esc(GRELHAS[x.p.grelha])} ${esc(x.p.codigo)}`).join(' · ') : (p.grelha ? '' : `<i class="sw" style="background:${esc(p.hex)}"></i>`) + esc(detalhe(p)) + (p.codigo ? ', ' + esc(p.codigo) : '')}</span>
    <span class="price">${varias ? 'A partir de ' + brl(Math.min(...g.map(x => x.preco))) : brl(preco)}</span>
    ${fo ? '<span class="chip">Forno opcional</span>' : ''}
    ${varias || fo ? `<button class="btn sm" data-act="ficha" data-ids="${esc(ids)}" data-ctx="loja">${rotuloOpcoes(varias, fo)}</button>`
      : `<div class="buyrow"><div class="qty"><button data-act="q-menos" data-id="${esc(p.id)}" aria-label="Diminuir">−</button><input id="q-${esc(p.id)}" type="number" min="1" max="999" step="1" value="1" inputmode="numeric" aria-label="Quantidade de ${esc(p.nome)}"><button data-act="q-mais" data-id="${esc(p.id)}" aria-label="Aumentar">+</button></div>
      <button class="btn sm" data-act="add-carrinho" data-id="${esc(p.id)}">Adicionar</button></div>`}
    ${no ? `<span class="chip info">${no} no carrinho</span>` : ''}</div>`; }).join('')}</div>` : `<div class="empty">Nenhum produto com este filtro.</div>`}`
  : `<div class="empty">A JCN ainda não liberou produtos para esta conta. Fale com o seu contato comercial.</div>`}`;
}

/* ---------- loja: carrinho, PIX e etiquetas ---------- */
function vCarrinho(u) {
  const itens = itensCarrinho(u), co = checkout(), px = state.conteudo.pix;
  if (!itens.length) return `<h1>Carrinho</h1><p class="sub">Seu carrinho está vazio.</p>
    <div class="empty">Escolha os produtos liberados para a sua loja e adicione ao carrinho.<br><button class="btn" style="margin-top:12px" data-act="nav" data-view="loja">Ver produtos</button></div>`;
  const total = itens.reduce((s, i) => s + i.qtd * i.preco, 0), un = itens.reduce((s, i) => s + i.qtd, 0);
  const comp = co.comprovante && state.arquivos[co.comprovante], etq = co.etiquetas.filter(id => state.arquivos[id]);
  return `<h1>Carrinho</h1><p class="sub">Confira os itens, pague por PIX, anexe o comprovante e as etiquetas e envie o pedido para a JCN.</p>
  <div class="panel"><h2>Itens</h2>
    <ul class="cart">
    ${itens.map(({ p, preco, qtd }) => `<li><div class="thumb">${fotoProd(p)}</div>
      <div class="ci"><b>${esc(p.nome)}</b><span class="note">${esc(detalhe(p))}${p.codigo ? ', ' + esc(p.codigo) : ''}</span><span class="note">${brl(preco)} cada</span></div>
      <label class="cq"><span class="sr">Quantidade de ${esc(p.nome)}</span><input class="inp qtd" id="cq-${esc(p.id)}" type="number" min="1" max="999" step="1" inputmode="numeric" data-chg="cart-qtd" data-id="${esc(p.id)}" value="${qtd}"></label>
      <b class="cs">${brl(preco * qtd)}</b>
      <button class="btn ghost sm cx" data-act="cart-rem" data-id="${esc(p.id)}" aria-label="Tirar ${esc(p.nome)} do carrinho">×</button></li>`).join('')}
    </ul>
    <p class="cart-total">${un} ${un > 1 ? 'unidades' : 'unidade'} <b>Total ${brl(total)}</b></p>
    <button class="btn ghost sm" data-act="nav" data-view="loja">Adicionar mais produtos</button></div>
  <div class="panel"><h2>Pagamento por PIX</h2>
    ${px.chave ? `<dl class="pixbox"><div><dt>Chave PIX</dt><dd id="pixChave">${esc(px.chave)}</dd></div>${px.favorecido ? `<div><dt>Favorecido</dt><dd>${esc(px.favorecido)}</dd></div>` : ''}${px.banco ? `<div><dt>Banco</dt><dd>${esc(px.banco)}</dd></div>` : ''}<div><dt>Valor</dt><dd>${brl(total)}</dd></div></dl>
      <button class="btn ghost sm" data-act="copiar-pix">Copiar chave</button>`
    : `<p class="note" style="margin:0">A JCN ainda não cadastrou a chave PIX aqui. Peça a chave ao seu contato comercial, pague ${brl(total)} e anexe o comprovante abaixo.</p>`}
    <h3 class="sub3">Comprovante</h3>
    ${comp ? `<ul class="files">${arqLi(comp.id, 'comp-loja-rem')}</ul>` : `<p class="note" style="margin:0 0 8px">Imagem ou PDF do comprovante do PIX. Sem ele o pedido não é enviado.</p>
    <label tabindex="0" class="btn ghost sm">Anexar comprovante<input type="file" accept="image/*,application/pdf" hidden data-file="comp-loja"></label>`}</div>
  <div class="panel"><h2>Etiquetas de envio (PDF) ${etq.length ? chip([etq.length + (etq.length > 1 ? ' arquivos' : ' arquivo'), 'ok']) : ''}</h2>
    <p class="note" style="margin:0 0 8px">Envie o PDF da etiqueta de cada volume. Este pedido tem ${un} ${un > 1 ? 'unidades' : 'unidade'}. Sem etiqueta o pedido não sai para expedição; se ainda não tiver todas, anexe depois em Meus pedidos.</p>
    ${etq.length ? `<ul class="files" style="margin-bottom:10px">${etq.map(id => arqLi(id, 'etq-loja-rem')).join('')}</ul>` : ''}
    <label tabindex="0" class="btn ghost sm">${etq.length ? 'Anexar mais etiquetas' : 'Anexar etiquetas em PDF'}<input type="file" accept="application/pdf" multiple hidden data-file="etq-loja"></label></div>
  <label class="field"><span>Observações para a JCN</span><textarea id="coObs" data-chg="co-obs">${esc(co.obs)}</textarea></label>
  <div class="bar" style="margin-top:14px"><button class="btn" data-act="enviar-pedido-loja">Enviar pedido</button><button class="btn ghost" data-act="cart-limpar" data-confirm="Confirmar: esvaziar">Esvaziar carrinho</button></div>`;
}

async function copiar(texto, alvo, ok) {
  try { await navigator.clipboard.writeText(texto); toast(ok); }
  catch (e) {                                                         // sem permissão de área de transferência: deixa o texto selecionado
    const el = alvo && $(alvo); if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast('Não foi possível copiar sozinho. O texto ficou selecionado: copie com Ctrl+C.');
  }
}

Object.assign(acts, {
  // administrador
  'nova-conta': () => { if (!podeConta(eu())) return; ui.acesso = null; ui.drawer = { tipo: 'conta', desc: 0, draft: { id: 'u-' + uid(), nome: '', doc: '', cidade: '', contato: '', vendedorResp: '', login: '', senhaNova: gerarSenha(), liberados: {}, ativo: true } }; renderDrawer(); },
  'editar-conta': e => { const u = user(e.dataset.id); if (!u || !podeConta(eu(), u)) return; ui.drawer = { tipo: 'conta', desc: 0, draft: { doc: '', cidade: '', contato: '', vendedorResp: '', ...JSON.parse(JSON.stringify(u)), senhaNova: '' } }; renderDrawer(); },
  'conta-gerar': () => { ui.drawer.draft.senhaNova = gerarSenha(); renderDrawer(); },
  'lib': e => { const d = ui.drawer.draft; if (e.checked) d.liberados[e.dataset.id] = precoBase(prod(e.dataset.id)); else delete d.liberados[e.dataset.id]; renderDrawer(); },
  'lib-todos': () => liberarLista(vendaveis()),
  'lib-colors': () => liberarLista(vendaveis().filter(p => p.cat === 'colors')),
  'lib-cat': e => liberarLista(vendaveis().filter(p => p.cat === e.dataset.id)),
  'lib-limpar': () => { ui.drawer.draft.liberados = {}; renderDrawer(); },
  'salvar-conta': async () => {
    const d = ui.drawer.draft, antigo = user(d.id), quem = eu();
    if (!podeConta(quem, antigo)) return toast('Você só altera as contas de e-commerce que são suas.');
    if (quem.papel === 'vendedor') d.vendedorResp = quem.id;            // loja criada pelo vendedor fica no nome dele
    const nome = (d.nome || '').trim(), login = (d.login || '').trim().toLowerCase(), senha = d.senhaNova || '';
    if (!nome) return toast('Informe o nome da loja.');
    if (!/^[a-z0-9]+([._-][a-z0-9]+)*$/.test(login) || login.length < 3 || login.length > 30) return toast('O login precisa ter de 3 a 30 caracteres: letras minúsculas e números, podendo ter ponto, hífen ou sublinhado no meio.');
    if (state.usuarios.some(u => u.id !== d.id && ((u.login || '') === login || (u.email || '').toLowerCase() === login))) return toast('Já existe uma conta com este login. Escolha outro.');
    const resp = user(d.vendedorResp);
    if (!resp || resp.papel !== 'vendedor') { const s = $('#ctVend'); if (s) s.focus(); return toast('Escolha de qual vendedor é este e-commerce.'); }
    if (!antigo && !senha) return toast('Defina a senha da loja ou use "Gerar senha".');
    if (senha && senha.length < 8) return toast('A senha precisa ter pelo menos 8 caracteres.');
    const liberados = {};
    for (const p of state.catalogo.produtos) {
      if (d.liberados[p.id] == null) continue;
      const v = dinheiro(d.liberados[p.id]);
      if (!(v > 0)) return toast('Informe o valor de ' + p.nome + ' para a loja, ou desmarque o produto.');
      liberados[p.id] = v;
    }
    const u = { id: d.id, nome, empresa: nome, email: '', login, papel: 'ecommerce', doc: (d.doc || '').trim(), cidade: (d.cidade || '').trim(), contato: (d.contato || '').trim(), vendedorResp: resp.id, ativo: !!d.ativo, liberados };
    if (ui.ocupado) return; ui.ocupado = true;
    const bt = $('[data-act=salvar-conta]'); if (bt) { bt.disabled = true; bt.textContent = 'Gravando…'; }
    try { await API.salvarLoja(u, senha, antigo); }
    catch (err) { ui.ocupado = false; if (bt) { bt.disabled = false; bt.textContent = 'Salvar conta'; } return toast(msgErro(err)); }
    ui.ocupado = false; ui.acesso = senha ? { nome, login, senha } : null;
    fecharDrawer(); renderApp(); scrollTo(0, 0);
    toast(Object.keys(liberados).length ? 'Conta salva.' : 'Conta salva sem produtos liberados: a loja ainda não vê nada.');
  },
  'copiar-acesso': () => { const a = ui.acesso; if (a) return copiar(`Área do E-commerce JCN Gourmet\nLogin: ${a.login}\nSenha: ${a.senha}`, '#acDados', 'Login e senha copiados.'); },
  // loja
  'q-menos': e => { const i = $('#q-' + e.dataset.id); i.value = Math.max(1, (parseInt(i.value, 10) || 1) - 1); },
  'q-mais': e => { const i = $('#q-' + e.dataset.id); i.value = Math.min(999, (parseInt(i.value, 10) || 0) + 1); },
  'add-carrinho': e => {
    const u = eu(), x = liberadosDe(u).find(l => l.p.id === e.dataset.id); if (!x) return toast('Este produto não está mais disponível para a sua conta.');
    const c = carrinho(), q = Math.min(999, Math.max(1, parseInt($('#q-' + e.dataset.id).value, 10) || 1));
    c[x.p.id] = Math.min(999, (c[x.p.id] || 0) + q); guardarCarrinho(); renderApp(); toast(`${q} × ${rotulo(x.p)} no carrinho.`);
  },
  'cart-rem': e => { delete carrinho()[e.dataset.id]; guardarCarrinho(); renderApp(); },
  'cart-limpar': () => { ui.carrinho = {}; guardarCarrinho(); renderApp(); },
  'comp-loja-rem': () => { const co = checkout(); Files.remove(co.comprovante); co.comprovante = null; renderApp(); },
  'etq-loja-rem': e => { const co = checkout(); co.etiquetas = co.etiquetas.filter(x => x !== e.dataset.id); Files.remove(e.dataset.id); renderApp(); },
  'copiar-pix': () => copiar(state.conteudo.pix.chave, '#pixChave', 'Chave PIX copiada.'),
  'enviar-pedido-loja': async () => {
    const u = eu(), itens = itensCarrinho(u), co = checkout();
    if (!itens.length) return toast('O carrinho está vazio.');
    if (!co.comprovante || !state.arquivos[co.comprovante]) return toast('Anexe o comprovante do PIX para enviar o pedido.');
    if (ui.ocupado) return; ui.ocupado = true;
    const bt = $('[data-act=enviar-pedido-loja]'); if (bt) { bt.disabled = true; bt.textContent = 'Enviando…'; }
    const etiquetas = co.etiquetas.filter(id => state.arquivos[id]);
    try {
      const r = await API.lancarPedido({ origem: 'ecommerce', cliente: { nome: u.nome, doc: u.doc || '', cidade: u.cidade || '' }, obs: co.obs || '', forma: 'pix',
        itens: itens.map(({ p, preco, qtd }) => ({ produto: p.id, qtd, preco })), comprovante: co.comprovante, etiquetas });
      ui.carrinho = {}; guardarCarrinho(); ui.checkout = null; ui.view = 'pedidos'; renderApp(); scrollTo(0, 0);
      toast(`Pedido nº ${r.numero} enviado. ${r.falhas.length ? 'Um dos arquivos não subiu: abra o pedido e anexe de novo.' : etiquetas.length ? 'A JCN vai conferir o PIX.' : 'Falta anexar as etiquetas.'}`);
    } catch (err) { toast(msgErro(err)); if (bt) { bt.disabled = false; bt.textContent = 'Enviar pedido'; } }
    finally { ui.ocupado = false; }
  }
});
Object.assign(chgs, {
  'pix-cfg': e => { if (eu().papel !== 'admin') return; state.conteudo.pix[e.dataset.k] = e.value.trim(); salvar('conteudo'); },
  'conta-desc': e => { ui.drawer.desc = Math.min(90, Math.max(0, parseFloat(e.value) || 0)); },
  'filtro-loja': e => { ui.catLoja = e.value; renderApp(); },
  'busca-loja': e => { ui.buscaLoja = e.value; renderApp(); },
  'cart-qtd': e => { carrinho()[e.dataset.id] = Math.min(999, Math.max(1, parseInt(e.value, 10) || 1)); guardarCarrinho(); renderApp(); },
  'co-obs': e => { checkout().obs = e.value; }
});
Object.assign(uploads, {
  'comp-loja': async f => { if (!PDF_IMG(f)) return toast('Envie o comprovante em imagem ou PDF.'); const m = await Files.put(f); checkout().comprovante = m.id; renderApp(); toast('Comprovante anexado.'); },
  'etq-loja': async f => { if (!ehPDF(f)) return toast(`${f.name || 'O arquivo'} não é PDF. As etiquetas precisam ser PDF.`); const m = await Files.put(f); checkout().etiquetas.push(m.id); renderApp(); }
});

/* ---------- Loja do site: consumidor final, sem login ----------
   Fica no fim da página inicial. Preço = tabela JCN + acréscimo (precoSite). A grelha é obrigatória e o forno é
   opcional, na mesma ficha do portal. O pedido entra em Pedidos com origem "site", para a JCN conferir o PIX. */
const LS_SACOLA = 'jcn-sacola-site';
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const lojaCfg = () => state.conteudo.loja || { ativa: true, acrescimo: 20 };
const naVitrine = () => state.pronto ? vendaveis().filter(p => precoSite(p) > 0) : [];
const soDig = s => String(s || '').replace(/\D/g, '');
function sacola() { if (!ui.sacola) { ui.sacola = {}; try { ui.sacola = JSON.parse(localStorage.getItem(LS_SACOLA)) || {}; } catch (e) { ui.sacola = {}; } } return ui.sacola; }
function guardarSacola() { const s = sacola(); Object.keys(s).forEach(k => { if (!(s[k] > 0)) delete s[k]; }); try { localStorage.setItem(LS_SACOLA, JSON.stringify(s)); } catch (e) { } }
function itensSacola() { const s = sacola(); return naVitrine().filter(p => s[p.id] > 0).map(p => ({ p, preco: precoSite(p), qtd: s[p.id] })); }
const qtdSacola = () => itensSacola().reduce((n, i) => n + i.qtd, 0);
function compra() { return ui.compra || (ui.compra = { nome: '', doc: '', fone: '', email: '', cep: '', rua: '', numero: '', compl: '', bairro: '', cidade: '', uf: 'SP', obs: '', comprovante: null }); }
// pedidos feitos neste aparelho (anotados no navegador); o andamento vem do servidor
function meusSite() { return (state.daqui || []).slice(); }
const notaDoSite = numero => lerPedidosDoSite().find(n => n.numero === numero);
const enderecoTxt = e => e ? `${e.rua}, ${e.numero}${e.compl ? ', ' + e.compl : ''}${e.bairro ? ' — ' + e.bairro : ''}. ${e.cidade}, ${e.uf}. CEP ${e.cep}` : '';

function renderVitrine() {
  const sec = $('#loja'); if (!sec) return;
  if ($('#site').hidden) { $('#vitrine').innerHTML = ''; return; }
  const cfg = lojaCfg(); sec.hidden = !cfg.ativa; if (!cfg.ativa) return;
  const foco = document.activeElement; if (foco && foco.id === 'vitBusca' && $('#vitrine').firstChild) return;     // não atrapalha quem está digitando a busca
  const todos = naVitrine(), cats = state.catalogo.categorias.filter(c => c.ativa && todos.some(p => p.cat === c.id));
  if (!cats.some(c => c.id === ui.catSite)) ui.catSite = cats[0] ? cats[0].id : '';
  const q = ui.buscaSite.trim().toLowerCase(), s = sacola(), n = qtdSacola(), meus = meusSite().length;
  const achados = todos.filter(p => q ? (p.nome + ' ' + p.codigo + ' ' + detalhe(p)).toLowerCase().includes(q) : p.cat === ui.catSite);   // a busca olha a loja inteira
  const gs = new Set(achados.map(p => p.grupo).filter(Boolean)), lista = todos.filter(p => achados.includes(p) || gs.has(p.grupo));
  const ms = modelos(lista); let sub = '';
  $('#vitrine').innerHTML = `
  <div class="vit-bar">
    <nav class="vit-cats" aria-label="Categorias da loja">${cats.map(c => `<button data-act="vit-cat" data-id="${esc(c.id)}" aria-current="${!q && c.id === ui.catSite}">${esc(c.nome)}</button>`).join('')}</nav>
    <div class="vit-acoes"><label class="sr" for="vitBusca">Buscar na loja</label><input id="vitBusca" class="inp" type="search" placeholder="Buscar produto" data-chg="vit-busca" value="${esc(ui.buscaSite)}">
      ${meus ? `<button class="btn ghost" data-act="meus-site">Meus pedidos</button>` : `<button class="btn ghost" data-act="meus-site">Acompanhar pedido</button>`}
      <button class="btn" data-act="sacola" id="vitSacola">Sacola${n ? ` <span class="badge">${n}</span>` : ''}</button></div>
  </div>
  ${q ? `<p class="note vit-res">${ms.length} ${ms.length === 1 ? 'produto encontrado' : 'produtos encontrados'} para "${esc(ui.buscaSite.trim())}". <button class="lnk" data-act="vit-limpar">Limpar a busca</button></p>` : ''}
  ${ms.length ? `<div class="cards shop vit-cards">${ms.map(g => { const p = g[0], varias = g.length > 1, ids = g.map(x => x.id).join(','), fo = fornosDe(p, 'site').length, no = g.reduce((t, x) => t + (s[x.id] || 0), 0);
    let titulo = ''; if (!q && (p.sub || '') !== sub) { sub = p.sub || ''; if (sub) titulo = `<h3 class="subh">${esc(sub)}</h3>`; }
    return titulo + `<article class="card">
      <button class="ph" data-act="ficha" data-ids="${esc(ids)}" data-ctx="site" aria-label="Ver ${esc(p.nome)}">${fotoDe(p, p.nome)}</button>
      <h3><button class="nome" data-act="ficha" data-ids="${esc(ids)}" data-ctx="site">${esc(p.nome)}</button></h3>
      <span class="note">${varias ? 'Grelha de ferro fundido ou de aço carbono' : (p.grelha ? '' : `<i class="sw" style="background:${esc(p.hex)}"></i>`) + esc(detalhe(p))}</span>
      <span class="price">${varias ? 'A partir de ' + brl(Math.min(...g.map(precoSite))) : brl(precoSite(p))}</span>
      ${fo ? '<span class="chip">Forno opcional</span>' : ''}
      ${varias || fo || ehFogao(p) ? `<button class="btn sm" data-act="ficha" data-ids="${esc(ids)}" data-ctx="site">${varias ? (fo ? 'Escolher grelha e forno' : 'Escolher a grelha') : fo ? 'Comprar, com ou sem forno' : 'Ver opções e comprar'}</button>`
                     : `<button class="btn sm" data-act="sacola-add" data-id="${esc(p.id)}">Adicionar à sacola</button>`}
      ${no ? `<span class="chip info">${no} na sacola</span>` : ''}</article>`; }).join('')}</div>`
  : `<div class="empty">${q ? 'Nenhum produto com esse nome ou código.' : 'Nenhum produto disponível nesta categoria.'}</div>`}
  <p class="note vit-pe">Preços para o consumidor final, com pagamento por PIX. O frete não está incluído: a JCN confirma valor e prazo com você antes do envio. Já comprou? <button class="lnk" data-act="meus-site">Acompanhar pedido</button></p>`;
}

/* ---------- sacola e fechamento ---------- */
function dSacola() {
  const itens = itensSacola(), c = compra(), px = state.conteudo.pix;
  if (!itens.length) return `<h2 class="dt">Sua sacola</h2><div class="empty">A sacola está vazia.<br><button class="btn" style="margin-top:12px" data-act="fechar">Ver os produtos</button></div>`;
  const total = itens.reduce((t, i) => t + i.qtd * i.preco, 0), un = itens.reduce((t, i) => t + i.qtd, 0), comp = c.comprovante && state.arquivos[c.comprovante];
  const campo = (k, t, extra = '') => `<label class="field"><span>${t}</span><input id="cp-${k}" data-c="${k}" value="${esc(c[k])}" ${extra}></label>`;
  return `<h2 class="dt">Sua sacola</h2>
  <div class="panel"><h2>Itens</h2>
    <ul class="cart">${itens.map(({ p, preco, qtd }) => `<li><div class="thumb">${fotoProd(p)}</div>
      <div class="ci"><b>${esc(p.nome)}</b><span class="note">${esc(detalhe(p))}${p.codigo ? ', ' + esc(p.codigo) : ''}</span><span class="note">${brl(preco)} cada</span></div>
      <label class="cq"><span class="sr">Quantidade de ${esc(p.nome)}</span><input class="inp qtd" id="sq-${esc(p.id)}" type="number" min="1" max="999" step="1" inputmode="numeric" data-chg="sac-qtd" data-id="${esc(p.id)}" value="${qtd}"></label>
      <b class="cs">${brl(preco * qtd)}</b>
      <button class="btn ghost sm cx" data-act="sac-rem" data-id="${esc(p.id)}" aria-label="Tirar ${esc(p.nome)} da sacola">×</button></li>`).join('')}</ul>
    <p class="cart-total">${un} ${un > 1 ? 'unidades' : 'unidade'} <b>Total ${brl(total)}</b></p>
    <p class="note" style="margin:0">Frete à parte: a JCN confirma o valor e o prazo pelo WhatsApp antes de enviar.</p></div>
  <div class="panel"><h2>Seus dados</h2><div class="rows">
    ${campo('nome', 'Nome completo ou razão social', 'autocomplete="name"')}
    <div class="grid2">${campo('doc', 'CPF ou CNPJ', 'inputmode="numeric"')}${campo('fone', 'WhatsApp com DDD', 'inputmode="tel" autocomplete="tel"')}</div>
    ${campo('email', 'E-mail (opcional)', 'type="email" autocomplete="email"')}</div></div>
  <div class="panel"><h2>Endereço de entrega</h2><div class="rows">
    <div class="grid2">${campo('cep', 'CEP', 'inputmode="numeric" autocomplete="postal-code"')}${campo('bairro', 'Bairro')}</div>
    <div class="grid-end">${campo('rua', 'Rua ou avenida', 'autocomplete="address-line1"')}${campo('numero', 'Número')}</div>
    ${campo('compl', 'Complemento (opcional)')}
    <div class="grid-end">${campo('cidade', 'Cidade')}<label class="field"><span>UF</span><select id="cp-uf" data-c="uf">${UFS.map(u => `<option ${u === c.uf ? 'selected' : ''}>${u}</option>`).join('')}</select></label></div></div></div>
  <div class="panel"><h2>Pagamento por PIX</h2>
    ${px.chave ? `<dl class="pixbox"><div><dt>Chave PIX</dt><dd id="pixChave">${esc(px.chave)}</dd></div>${px.favorecido ? `<div><dt>Favorecido</dt><dd>${esc(px.favorecido)}</dd></div>` : ''}${px.banco ? `<div><dt>Banco</dt><dd>${esc(px.banco)}</dd></div>` : ''}<div><dt>Valor</dt><dd>${brl(total)}</dd></div></dl>
      <button class="btn ghost sm" data-act="copiar-pix">Copiar chave</button>`
    : `<p class="note" style="margin:0">A chave PIX ainda não está disponível aqui. Peça pelo WhatsApp (17) 99151-9932, pague ${brl(total)} e anexe o comprovante abaixo.</p>`}
    <h3 class="sub3">Comprovante</h3>
    ${comp ? `<ul class="files"><li><span class="nm">${esc(comp.nome)}</span><span class="mt">${kb(comp.tamanho)}</span><button class="btn danger sm" data-act="comp-site-rem">Remover</button></li></ul>`
    : `<p class="note" style="margin:0 0 8px">Imagem ou PDF do comprovante do PIX. Sem ele o pedido não é enviado.</p>
    <label tabindex="0" class="btn ghost sm">Anexar comprovante<input type="file" accept="image/*,application/pdf" hidden data-file="comp-site"></label>`}</div>
  <label class="field"><span>Observações (opcional)</span><textarea id="cp-obs" data-c="obs">${esc(c.obs)}</textarea></label>
  <p class="err" id="cpErro" role="alert" ${ui.erroCompra ? '' : 'hidden'}>${esc(ui.erroCompra || '')}</p>
  <div class="foot"><button class="btn" data-act="enviar-pedido-site">Enviar pedido</button><button class="btn ghost" data-act="fechar">Continuar comprando</button></div>`;
}
function validarCompra(c) {
  const d = soDig(c.doc), f = soDig(c.fone), cep = soDig(c.cep);
  if (c.nome.trim().length < 5) return ['nome', 'Escreva o nome completo ou a razão social.'];
  if (d.length !== 11 && d.length !== 14) return ['doc', 'O CPF tem 11 números e o CNPJ tem 14. Confira o que foi digitado.'];
  if (f.length < 10 || f.length > 11) return ['fone', 'Informe o WhatsApp com DDD, por exemplo (17) 99999-0000.'];
  if (c.email.trim() && !/^\S+@\S+\.\S+$/.test(c.email.trim())) return ['email', 'O e-mail parece incompleto. Corrija ou deixe em branco.'];
  if (cep.length !== 8) return ['cep', 'O CEP tem 8 números.'];
  if (!c.rua.trim()) return ['rua', 'Informe a rua ou avenida da entrega.'];
  if (!c.numero.trim()) return ['numero', 'Informe o número. Se não houver, escreva "s/n".'];
  if (!c.cidade.trim()) return ['cidade', 'Informe a cidade da entrega.'];
  return null;
}
function dPedidoSite(p, dr) {
  const comp = p.pix.nomeComp ? { nome: p.pix.nomeComp } : (p.pix.arquivo && state.arquivos[p.pix.arquivo]), et = ['aguardando', 'expedicao', 'enviado'], ix = et.indexOf(p.envio), nota = notaDoSite(p.numero);
  return `<h2 class="dt">${dr.novo ? 'Pedido recebido' : 'Pedido nº ' + p.numero}</h2>
  ${dr.novo ? `<div class="acesso" role="status"><h2>Anote o número: ${p.numero}</h2><p>${p.pix.status === 'sem' ? 'Recebemos o seu pedido, mas o comprovante não subiu: envie de novo no botão abaixo.' : 'Recebemos o seu pedido e o comprovante.'} A JCN Gourmet confere o PIX e fala com você pelo WhatsApp ${esc(p.cliente.fone)} para combinar o frete e o prazo.</p></div>` : ''}
  <p style="margin:0 0 14px"><b>${esc(p.cliente.nome)}</b><br><span class="note">Feito em ${dataBR(p.criado)}.${p.cliente.endereco ? ' Entrega: ' + esc(enderecoTxt(p.cliente.endereco)) : ''}</span></p>
  <div class="tbl-wrap" style="margin-bottom:16px"><table class="tbl" style="min-width:0"><thead><tr><th>Item</th><th class="num">Qtd.</th><th class="num">Subtotal</th></tr></thead><tbody>
    ${p.itens.map(i => `<tr><td>${esc(i.nome)}${i.codigo ? `<br><span class="note">${esc(i.codigo)}</span>` : ''}</td><td class="num">${i.qtd}</td><td class="num">${brl(i.qtd * i.preco)}</td></tr>`).join('')}
    <tr><td colspan="2" class="num"><b>Total, sem o frete</b></td><td class="num"><b>${brl(totalPedido(p))}</b></td></tr></tbody></table></div>
  <div class="panel"><h2>Pagamento ${chip(PIX[p.pix.status])}</h2>
    <p class="note" style="margin:0">${p.pix.status === 'verificado' ? 'PIX conferido pela JCN.' : p.pix.status === 'recusado' ? 'O comprovante não foi aceito. Envie outro para o pedido voltar à conferência.' : comp ? 'Comprovante recebido: ' + esc(comp.nome) + '. Aguardando a conferência.' : 'Comprovante recebido. Aguardando a conferência.'}</p>
    ${(p.pix.status === 'recusado' || p.pix.status === 'sem') && nota && nota.chave ? `<div class="bar" style="margin:10px 0 0"><label tabindex="0" class="btn ghost sm">Enviar novo comprovante<input type="file" accept="image/*,application/pdf" hidden data-file="comp-site-pedido"></label></div>` : ''}</div>
  <div class="panel"><h2>Envio</h2><ol class="steps">${et.map((s, i) => `<li class="${i < ix ? 'done' : i === ix ? 'now' : ''}">${ENVIO[s][0]}</li>`).join('')}</ol></div>
  <p class="note">Dúvidas sobre este pedido: WhatsApp (17) 99151-9932, informando o número ${p.numero}.</p>
  <div class="foot"><button class="btn" data-act="fechar">${dr.novo ? 'Voltar para a loja' : 'Fechar'}</button>${dr.novo ? '' : '<button class="btn ghost" data-act="meus-site">Outros pedidos</button>'}</div>`;
}
function dMeusSite(dr) {
  const l = meusSite().sort((a, b) => b.numero - a.numero);
  return `<h2 class="dt">Acompanhar pedido</h2>
  ${l.length ? `<div class="panel"><h2>Pedidos feitos neste aparelho</h2><ul class="files">${l.map(p => `<li><span class="nm">Nº ${p.numero} <span class="note">· ${dataBR(p.criado)} · ${brl(totalPedido(p))}</span></span>${chip(PIX[p.pix.status])}${chip(ENVIO[p.envio])}
    <button class="btn ghost sm" data-act="abrir-pedido-site" data-id="${esc(p.id)}">Abrir</button></li>`).join('')}</ul></div>` : ''}
  <div class="panel"><h2>${l.length ? 'Comprou em outro aparelho?' : 'Encontre o seu pedido'}</h2>
    <p class="note" style="margin:0 0 10px">Informe o número do pedido e o CPF ou CNPJ usado na compra.</p>
    <div class="grid2"><label class="field"><span>Número do pedido</span><input id="acNum" inputmode="numeric" value="${esc(dr.num || '')}"></label><label class="field"><span>CPF ou CNPJ</span><input id="acDoc" inputmode="numeric" value="${esc(dr.doc || '')}"></label></div>
    <p class="err" id="acErro" role="alert" ${dr.erro ? '' : 'hidden'}>${esc(dr.erro || '')}</p>
    <div class="bar" style="margin:10px 0 0"><button class="btn" data-act="buscar-pedido-site">Procurar</button></div></div>
  <div class="foot"><button class="btn ghost" data-act="fechar">Fechar</button></div>`;
}

Object.assign(acts, {
  'vit-cat': e => { ui.catSite = e.dataset.id; ui.buscaSite = ''; renderVitrine(); },
  'vit-limpar': () => { ui.buscaSite = ''; renderVitrine(); const b = $('#vitBusca'); if (b) b.focus(); },
  'sacola': () => { ui.erroCompra = ''; ui.drawer = { tipo: 'sacola', pub: true }; renderDrawer(); },
  'sacola-add': e => { const p = prod(e.dataset.id); if (!p || !naVitrine().includes(p)) return toast('Este produto não está mais disponível.'); const s = sacola(); s[p.id] = Math.min(999, (s[p.id] || 0) + 1); guardarSacola(); renderVitrine(); toast(`${rotulo(p)} na sacola.`); },
  'sac-rem': e => { delete sacola()[e.dataset.id]; guardarSacola(); renderVitrine(); renderDrawer(); },
  'comp-site-rem': () => { const c = compra(); if (c.comprovante) Files.remove(c.comprovante); c.comprovante = null; renderDrawer(); },
  'meus-site': () => { ui.drawer = { tipo: 'meus-site', pub: true, erro: '' }; renderDrawer(); },
  'abrir-pedido-site': e => { ui.drawer = { tipo: 'pedido-site', pub: true, id: e.dataset.id }; renderDrawer(); },
  'buscar-pedido-site': async () => {
    const n = parseInt(soDig($('#acNum').value), 10), d = soDig($('#acDoc').value);
    ui.drawer.num = $('#acNum').value; ui.drawer.doc = $('#acDoc').value;                 // o que foi digitado continua no campo se der erro
    const nao = () => { ui.drawer.erro = 'Não encontramos um pedido com esse número e esse documento. Confira os dois e tente de novo.'; renderDrawer(); };
    if (!n || !d) return nao();
    let a = null; try { a = await andamentoDoSite(n, d); } catch (err) { ui.drawer.erro = msgErro(err); return renderDrawer(); }
    if (!a) return nao();
    if (!notaDoSite(n)) guardarPedidosDoSite([{ numero: n, doc: d }, ...lerPedidosDoSite()]);
    await carregarPedidosDoSite();
    const p = state.daqui.find(x => x.numero === n); if (!p) return nao();
    ui.drawer = { tipo: 'pedido-site', pub: true, id: p.id }; renderDrawer(); renderVitrine();
  },
  'enviar-pedido-site': async () => {
    const itens = itensSacola(), c = compra();
    const falha = (campo, msg) => { ui.erroCompra = msg; renderDrawer(); const el = campo && $('#cp-' + campo); if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); } else $('#cpErro').scrollIntoView({ block: 'center' }); };
    if (!itens.length) return falha('', 'A sacola está vazia.');
    const erro = validarCompra(c); if (erro) return falha(erro[0], erro[1]);
    if (!c.comprovante || !state.arquivos[c.comprovante]) return falha('', 'Anexe o comprovante do PIX para enviar o pedido.');
    if (ui.ocupado) return; ui.ocupado = true;
    const bt = $('[data-act=enviar-pedido-site]'); if (bt) { bt.disabled = true; bt.textContent = 'Enviando…'; }
    let r;
    try { r = await API.pedidoDoSite(c, itens, c.comprovante); }
    catch (err) { ui.ocupado = false; return falha('', msgErro(err)); }
    ui.ocupado = false;
    ui.sacola = {}; guardarSacola(); ui.compra = { ...c, obs: '', comprovante: null }; ui.erroCompra = '';
    const p = state.daqui.find(x => x.numero === r.numero);
    ui.drawer = { tipo: 'pedido-site', pub: true, id: p ? p.id : r.id, novo: true }; renderDrawer(); const dw = $('.drawer'); if (dw) dw.scrollTop = 0; renderVitrine();
  }
});
Object.assign(chgs, {
  'vit-busca': e => { ui.buscaSite = e.value; e.blur(); renderVitrine(); },
  'sac-qtd': e => { sacola()[e.dataset.id] = Math.min(999, Math.max(1, parseInt(e.value, 10) || 1)); guardarSacola(); renderVitrine(); renderDrawer(); },
  'loja-site': e => {
    const l = state.conteudo.loja; if (e.dataset.k === 'ativa') l.ativa = e.checked; else { l.acrescimo = Math.min(500, Math.max(0, parseFloat(String(e.value).replace(',', '.')) || 0)); e.value = l.acrescimo; }
    salvar('conteudo'); const z = state.catalogo.produtos.find(p => p.preco > 0), ex = $('#ljExemplo'); if (z && ex) ex.textContent = `Exemplo: ${z.nome} sai de ${brl(z.preco)} na tabela para ${brl(precoSite(z))} no site.`;
  }
});
Object.assign(uploads, {
  'comp-site': async f => { if (!PDF_IMG(f)) { ui.erroCompra = 'Envie o comprovante em imagem ou PDF.'; return renderDrawer(); } const m = await Files.put(f); compra().comprovante = m.id; ui.erroCompra = ''; renderDrawer(); toast('Comprovante anexado.'); },
  'comp-site-pedido': async f => {
    if (!PDF_IMG(f)) return toast('Envie o comprovante em imagem ou PDF.');
    const p = ui.drawer && state.daqui.find(x => x.id === ui.drawer.id), nota = p && notaDoSite(p.numero); if (!p || !nota || !nota.chave || p.pix.status === 'verificado') return;
    const m = await Files.put(f);
    try { nota.comprovante = await API.comprovanteDoSite(nota, m.id); guardarPedidosDoSite(lerPedidosDoSite().map(n => n.numero === nota.numero ? nota : n)); toast('Comprovante enviado para conferência.'); }
    catch (err) { toast(msgErro(err)); }
    if (papelAtual()) await carregarPedidos(); else await carregarPedidosDoSite();
    const q = state.daqui.find(x => x.numero === nota.numero); if (q && ui.drawer) ui.drawer.id = q.id; renderDrawer();
  }
});
document.addEventListener('input', ev => { const t = ev.target; if (t.dataset && t.dataset.c && ui.compra) ui.compra[t.dataset.c] = t.value; });

/* ---------- Financeiro (administração): quanto vendeu, o que falta receber e os boletos para aprovar ----------
   "Vendido" = pedidos com pagamento confirmado: PIX verificado ou boleto aprovado.
   Venda de loja de e-commerce conta para o vendedor responsável por ela. */
const PERIODOS = [['mes', 'Este mês'], ['anterior', 'Mês passado'], ['90', 'Últimos 90 dias'], ['ano', 'Este ano'], ['tudo', 'Desde o início']];
function intervalo(k) {
  const h = hojeISO(), ano = +h.slice(0, 4), mes = +h.slice(5, 7), z = n => String(n).padStart(2, '0');
  if (k === 'mes') return [`${ano}-${z(mes)}-01`, h];
  if (k === 'anterior') { const a = mes === 1 ? ano - 1 : ano, m = mes === 1 ? 12 : mes - 1; return [`${a}-${z(m)}-01`, somaDias(`${ano}-${z(mes)}-01`, -1)]; }
  if (k === '90') return [somaDias(h, -89), h];
  if (k === 'ano') return [`${ano}-01-01`, h];
  return ['0000-00-00', '9999-12-31'];
}
const noPeriodo = (p, [de, ate]) => p.criado >= de && p.criado <= ate;
const somaPed = l => l.reduce((s, p) => s + totalPedido(p), 0);
const canalDe = p => p.origem === 'ecommerce' ? 'E-commerce' : p.origem === 'site' ? 'Loja do site' : 'Vendedores';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);

function vFinanceiro() {
  const per = PERIODOS.some(x => x[0] === ui.finPer) ? ui.finPer : (ui.finPer = 'mes'), faixa = intervalo(per), hoje = hojeISO();
  const todos = state.pedidos, noPer = todos.filter(p => noPeriodo(p, faixa));
  const vend = noPer.filter(pagoOk), aguard = noPer.filter(paraConferir), semPag = noPer.filter(p => !ehBoleto(p) && p.pix.status === 'sem');
  const total = somaPed(vend);
  // recebido e a receber
  const parc = todos.filter(p => ehBoleto(p) && p.pagamento.status === 'aprovado').flatMap(p => parcelasDe(p).map(x => ({ ...x, p })));
  const recebidoPer = somaPed(vend.filter(p => !ehBoleto(p))) + vend.filter(ehBoleto).reduce((s, p) => s + parcelasDe(p).filter(x => x.recebida).reduce((t, x) => t + x.valor, 0), 0);
  const abertas = parc.filter(x => !x.recebida).sort((a, b) => a.vence < b.vence ? -1 : a.vence > b.vence ? 1 : a.p.numero - b.p.numero), vencidas = abertas.filter(x => x.vence < hoje);
  const aReceber = abertas.reduce((s, x) => s + x.valor, 0);
  const boletos = todos.filter(p => ehBoleto(p) && p.pagamento.status === 'pendente').sort((a, b) => a.numero - b.numero);
  // por vendedor: vendas próprias + lojas de e-commerce que ele atende
  const linhas = new Map();
  const linha = (k, nome) => { if (!linhas.has(k)) linhas.set(k, { nome, pn: 0, pv: 0, ln: 0, lv: 0 }); return linhas.get(k); };
  const marca = u => u.nome + (u.papel === 'admin' ? ' (administração)' : u.papel === 'representante' ? ' (representante)' : '');
  state.usuarios.filter(u => u.ativo && (u.papel === 'vendedor' || u.papel === 'representante')).forEach(u => linha(u.id, marca(u)));
  vend.forEach(p => {
    const v = totalPedido(p);
    if (p.origem === 'site') { const l = linha('~site', 'Loja do site (sem vendedor)'); l.pn++; l.pv += v; }
    else if (p.origem === 'ecommerce') { const r = respDe(p), l = r && user(r) ? linha(r, user(r).nome) : linha('~sem', 'E-commerce sem vendedor definido'); l.ln++; l.lv += v; }
    else { const u = user(p.vendedor), l = linha(p.vendedor || '~?', u ? marca(u) : 'Usuário removido'); l.pn++; l.pv += v; }
  });
  const porVend = [...linhas.values()].sort((a, b) => (b.pv + b.lv) - (a.pv + a.lv));
  // por loja de e-commerce
  const lojasV = lojas().map(l => { const ps = vend.filter(p => p.origem === 'ecommerce' && p.vendedor === l.id); return { l, n: ps.length, v: somaPed(ps) }; }).filter(x => x.n).sort((a, b) => b.v - a.v);
  const canais = ['Vendedores', 'E-commerce', 'Loja do site'].map(c => { const ps = vend.filter(p => canalDe(p) === c); return [c, ps.length, somaPed(ps)]; });
  // produtos
  const pm = new Map(); vend.forEach(p => p.itens.forEach(i => { const k = i.codigo || i.nome, o = pm.get(k) || { nome: i.nome, codigo: i.codigo, q: 0, v: 0 }; o.q += i.qtd; o.v += i.qtd * i.preco; pm.set(k, o); }));
  const prods = [...pm.values()].sort((a, b) => b.v - a.v).slice(0, 8);
  // últimos 6 meses, sempre
  const mesesL = []; { let a = +hoje.slice(0, 4), m = +hoje.slice(5, 7); for (let i = 0; i < 6; i++) { mesesL.push(`${a}-${String(m).padStart(2, '0')}`); m--; if (!m) { m = 12; a--; } } }
  const porMes = mesesL.map(k => { const ps = todos.filter(p => p.criado.slice(0, 7) === k && pagoOk(p)); return [k, ps.length, somaPed(ps)]; });
  const tile = (rot, valor, sub, id) => `<div class="tile" id="${id}"><span class="t-rot">${rot}</span><b class="t-val">${valor}</b><span class="t-sub">${sub}</span></div>`;
  const pl = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  return `<h1>Financeiro</h1><p class="sub">Quanto a JCN vendeu, o que já entrou, o que falta receber e os boletos que esperam aprovação. Conta como vendido o pedido com PIX verificado ou boleto aprovado.</p>
  <div class="bar"><label class="sr" for="finPer">Período</label><select id="finPer" class="inp" style="width:auto" data-chg="fin-per">${PERIODOS.map(([k, t]) => `<option value="${k}" ${k === per ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <span class="note">${per === 'tudo' ? 'Todos os pedidos' : `Pedidos de ${dataBR(faixa[0])} a ${dataBR(faixa[1])}`}</span></div>
  <div class="tiles">
    ${tile('Vendido', brl(total), vend.length ? `${pl(vend.length, 'pedido', 'pedidos')}, média de ${brl(total / vend.length)}` : 'Nenhum pedido confirmado no período', 'tVendido')}
    ${tile('Recebido', brl(recebidoPer), 'PIX verificados e parcelas de boleto já recebidas', 'tRecebido')}
    ${tile('A receber em boleto', brl(aReceber), abertas.length ? `${pl(abertas.length, 'parcela em aberto', 'parcelas em aberto')}${vencidas.length ? ', ' + pl(vencidas.length, 'vencida', 'vencidas') : ''}` : 'Nenhuma parcela em aberto', 'tReceber')}
    ${tile('Aguardando conferência', brl(somaPed(aguard)), aguard.length ? `${pl(aguard.filter(p => !ehBoleto(p)).length, 'PIX para conferir', 'PIX para conferir')}, ${pl(aguard.filter(ehBoleto).length, 'boleto para aprovar', 'boletos para aprovar')}` : 'Nada esperando por você', 'tAguardando')}
  </div>
  ${semPag.length ? `<p class="note" style="margin:-4px 0 16px">Fora dessas contas: ${pl(semPag.length, 'pedido', 'pedidos')} sem comprovante de PIX, somando ${brl(somaPed(semPag))}.</p>` : ''}

  <div class="panel" id="finBoletos"><h2>Boletos para aprovar ${boletos.length ? chip([String(boletos.length), 'warn']) : ''}</h2>
    ${boletos.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Vendedor</th><th>Parcelas</th><th class="num">Total</th><th></th></tr></thead><tbody>
      ${boletos.map(p => `<tr><td><b>${p.numero}</b></td><td>${dataBR(p.criado)}</td><td>${esc(p.cliente.nome)}<br><span class="note">${esc(p.cliente.doc || p.cliente.cidade || '')}</span></td><td>${esc((user(p.vendedor) || {}).nome || '')}</td>
        <td>${esc(prazosTxt(p.pagamento.dias))}</td><td class="num">${brl(totalPedido(p))}</td><td><button class="btn sm" data-act="abrir-pedido" data-id="${esc(p.id)}">Analisar</button></td></tr>`).join('')}</tbody></table></div>`
    : '<p class="note" style="margin:0">Nenhum pedido de boleto esperando aprovação.</p>'}</div>

  <div class="panel" id="finVend"><h2>Vendas por vendedor e representante</h2>
    <p class="note" style="margin:0 0 10px">A venda de uma loja de e-commerce entra para o vendedor responsável por ela.</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Quem vendeu</th><th class="num">Pedidos próprios</th><th class="num">Valor</th><th class="num">Pedidos das lojas</th><th class="num">Valor</th><th class="num">Total</th></tr></thead><tbody>
      ${porVend.map(l => `<tr><td><b>${esc(l.nome)}</b></td><td class="num">${l.pn}</td><td class="num">${brl(l.pv)}</td><td class="num">${l.ln}</td><td class="num">${brl(l.lv)}</td><td class="num"><b>${brl(l.pv + l.lv)}</b></td></tr>`).join('')}
      <tr><td><b>Total</b></td><td class="num">${porVend.reduce((s, l) => s + l.pn, 0)}</td><td class="num">${brl(porVend.reduce((s, l) => s + l.pv, 0))}</td><td class="num">${porVend.reduce((s, l) => s + l.ln, 0)}</td><td class="num">${brl(porVend.reduce((s, l) => s + l.lv, 0))}</td><td class="num"><b>${brl(total)}</b></td></tr></tbody></table></div></div>

  <div class="fin2">
    <div class="panel" id="finCanal"><h2>Por canal</h2><div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Canal</th><th class="num">Pedidos</th><th class="num">Vendido</th></tr></thead><tbody>
      ${canais.map(([c, n, v]) => `<tr><td>${c}</td><td class="num">${n}</td><td class="num">${brl(v)}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="panel" id="finMes"><h2>Últimos 6 meses</h2><div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Mês</th><th class="num">Pedidos</th><th class="num">Vendido</th></tr></thead><tbody>
      ${porMes.map(([k, n, v]) => `<tr><td>${MESES[+k.slice(5) - 1]} de ${k.slice(0, 4)}</td><td class="num">${n}</td><td class="num">${brl(v)}</td></tr>`).join('')}</tbody></table></div></div>
  </div>

  <div class="panel" id="finLojas"><h2>Por loja de e-commerce</h2>
    ${lojasV.length ? `<div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Loja</th><th>Vendedor responsável</th><th class="num">Pedidos</th><th class="num">Vendido</th></tr></thead><tbody>
      ${lojasV.map(({ l, n, v }) => `<tr><td><b>${esc(l.nome)}</b></td><td>${l.vendedorResp && user(l.vendedorResp) ? esc(user(l.vendedorResp).nome) : chip(['definir em Contas e-commerce', 'warn'])}</td><td class="num">${n}</td><td class="num">${brl(v)}</td></tr>`).join('')}</tbody></table></div>`
    : '<p class="note" style="margin:0">Nenhuma venda de e-commerce confirmada no período.</p>'}</div>

  <div class="panel" id="finParcelas"><h2>Parcelas de boleto em aberto</h2>
    ${abertas.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Vencimento</th><th>Pedido</th><th>Cliente</th><th>Parcela</th><th class="num">Valor</th><th>Situação</th><th>Recebida</th></tr></thead><tbody>
      ${abertas.map(x => { const d = diasEntre(hoje, x.vence); return `<tr><td>${dataBR(x.vence)}</td><td><button class="lnk" data-act="abrir-pedido" data-id="${esc(x.p.id)}">nº ${x.p.numero}</button></td><td>${esc(x.p.cliente.nome)}</td><td>${x.n} de ${x.de}</td><td class="num">${brl(x.valor)}</td>
        <td>${d < 0 ? chip([`Vencida há ${pl(-d, 'dia', 'dias')}`, 'bad']) : d === 0 ? chip(['Vence hoje', 'warn']) : chip([`Vence em ${pl(d, 'dia', 'dias')}`, ''])}</td>
        <td><input type="checkbox" class="toggle" data-act="parc-rec" data-id="${esc(x.p.id)}" data-d="${x.dias}" aria-label="Parcela ${x.n} do pedido ${x.p.numero} recebida"></td></tr>`; }).join('')}</tbody></table></div>`
    : '<p class="note" style="margin:0">Nenhuma parcela em aberto. As parcelas aparecem aqui quando um boleto é aprovado.</p>'}</div>

  <div class="panel" id="finProd"><h2>Produtos mais vendidos</h2>
    ${prods.length ? `<div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Produto</th><th>Código</th><th class="num">Unidades</th><th class="num">Vendido</th></tr></thead><tbody>
      ${prods.map(o => `<tr><td>${esc(o.nome)}</td><td>${esc(o.codigo || '')}</td><td class="num">${o.q}</td><td class="num">${brl(o.v)}</td></tr>`).join('')}</tbody></table></div>`
    : '<p class="note" style="margin:0">Nenhuma venda confirmada no período.</p>'}</div>`;
}
Object.assign(chgs, { 'fin-per': e => { ui.finPer = e.value; renderApp(); } });

/* ============================================================================
   DADOS DE VERDADE (Supabase)
   As telas continuam trabalhando com o mesmo "state" do protótipo. Este arquivo:
   1. lê o banco e monta o state (o servidor só entrega o que a pessoa pode ver);
   2. quando uma tela chama salvar('parte'), compara com o último retrato do servidor,
      manda só a diferença e relê. Se o servidor recusar, avisa e volta ao que vale;
   3. cuida do que nasce no servidor: login, contas, pedidos novos e arquivos.
   ============================================================================ */
const CAT_ID = { 'colors': 'colors', 'fogoes-baixa-pressao': 'industriais', 'fogoes-alta-pressao': 'altapressao', 'fogoes-camping': 'camping', 'fornos-cavalete': 'fornos', 'fornos-avulsos': 'fornosavulsos',
  'tachos-fritadores': 'tacho', 'sanduicheiras': 'sanduicheiras', 'chapeiras': 'chapeiras', 'discos-de-arado': 'disco', 'picadores': 'picadores', 'engenhos': 'engenho', 'mesas-de-panificacao': 'mesas',
  'lanca-chamas': 'lanca', 'banquetas': 'banquetas', 'cabideiros': 'cabideiros', 'prateleiras': 'prateleiras', 'portao-pet': 'portaopet' };
const PIX_BD = { sem_comprovante: 'sem', em_analise: 'analise', verificado: 'verificado', recusado: 'recusado' }, PIX_TELA = { sem: 'sem_comprovante', analise: 'em_analise', verificado: 'verificado', recusado: 'recusado' };
const ENVIO_BD = { aguardando_pagamento: 'aguardando', em_expedicao: 'expedicao', enviado: 'enviado' }, ENVIO_TELA = { aguardando: 'aguardando_pagamento', expedicao: 'em_expedicao', enviado: 'enviado' };
const LS_SITE = 'jcn-pedidos-do-site';
const clone = o => JSON.parse(JSON.stringify(o));
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const espelho = {};                       // último retrato do servidor, por parte
const dataLocal = iso => { const t = new Date(iso); return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const nomeSeguro = n => String(n || 'arquivo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-80) || 'arquivo';
const slugDe = n => String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'categoria';
// A loja entra com um login, mas o Supabase Auth pede um e-mail: o site forma um endereço interno com o domínio do próprio site.
// Nenhuma mensagem é enviada para ele. O endereço fica gravado na conta, então continua valendo se o site mudar de hospedagem.
function enderecoDaLoja(login) {
  const d = String(CONFIG.dominio_dos_logins || location.hostname || '').toLowerCase().replace(/^www\./, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) || /^\d+(\.\d+){3}$/.test(d)) throw new Error('Preencha "dominio_dos_logins" no arquivo config.js com o domínio do site (ex.: jcngourmet.com.br).');
  return `loja-${login}@${d}`;
}
const papelAtual = () => { const u = typeof eu === 'function' ? eu() : null; return u ? u.papel : null; };
function msgErro(e) {
  const m = (e && e.message) || '';
  if (e && e.rede) return m;
  if (/row-level security|permission denied|42501/i.test(m + ' ' + (e && e.code))) return 'Você não tem permissão para fazer esta alteração.';
  if (/duplicate key|23505/i.test(m + ' ' + (e && e.code))) return /codigo/i.test(m) ? 'Já existe um produto com este código.' : /login|email/i.test(m) ? 'Já existe uma conta com este login ou e-mail.' : 'Este registro já existe.';
  if (/JWT|token/i.test(m) && e.status === 401) return 'Sua sessão terminou. Entre de novo.';
  return m || 'Não foi possível concluir. Tente de novo.';
}
// o banco devolve no máximo 1000 linhas por vez: busca em páginas até acabar
async function selTudo(tabela, consulta) {
  const tudo = [];
  for (let i = 0; ; i += 1000) { const l = await SB.sel(tabela, `${consulta}&limit=1000&offset=${i}`); tudo.push(...l); if (l.length < 1000) return tudo; }
}
function inicial() {
  const d = defaults(); d.usuarios = []; d.pedidos = []; d.daqui = []; d.arquivos = {};
  d.conteudo.pix = { chave: '', favorecido: '', banco: '' }; d.conteudo.loja = { ativa: false, acrescimo: 20 };
  return d;
}

/* ---------- leitura ---------- */
async function carregarCatalogo() {
  const interno = ['admin', 'vendedor', 'representante'].includes(papelAtual());
  const [cats, prods, fotos, fornos, vit, precos] = await Promise.all([
    SB.sel('categorias', 'select=*&order=ordem.asc,nome.asc'), selTudo('produtos', 'select=*&order=ordem.asc,nome.asc,id.asc'), selTudo('fotos_produto', 'select=*&order=ordem.asc,id.asc'),
    selTudo('fornos_do_fogao', 'select=*&order=ordem.asc,fogao_id.asc,forno_id.asc'), selTudo('vitrine', 'select=*&order=produto_id.asc'), interno ? selTudo('precos', 'select=produto_id,valor&order=produto_id.asc') : []]);
  const catDe = new Map(cats.map(c => [c.id, CAT_ID[c.slug] || c.slug]));
  const preco = new Map(precos.map(x => [x.produto_id, Number(x.valor)])), vitr = new Map(vit.map(x => [x.produto_id, Number(x.preco)]));
  const fotosDe = {}, fornosDe2 = {};
  fotos.forEach(f => (fotosDe[f.produto_id] = fotosDe[f.produto_id] || []).push(f.caminho.startsWith('img:') ? f.caminho : 'pub:' + f.caminho));
  fornos.forEach(f => (fornosDe2[f.fogao_id] = fornosDe2[f.fogao_id] || []).push(f.forno_id));
  state.catalogo = {
    versao: 4,
    categorias: cats.map(c => ({ id: catDe.get(c.id), uuid: c.id, nome: c.nome, ativa: c.ativa, ordem: c.ordem })),
    produtos: prods.map(r => ({ id: r.id, cat: catDe.get(r.categoria_id), nome: r.nome, codigo: r.codigo || '', cor: r.cor || '', hex: r.cor_hex || '#8A8A8A', slogan: r.frase || '', historia: r.historia || '',
      specs: Array.isArray(r.especificacoes) ? r.especificacoes : [], preco: preco.get(r.id) || 0, vit: vitr.has(r.id) ? vitr.get(r.id) : null, grupo: r.grupo || '', grelha: r.grelha || '', sub: r.subgrupo || '',
      fornos: fornosDe2[r.id] || [], mostrar_preco: !!r.mostrar_preco, ativo: !!r.ativo, ordem: r.ordem, fotos: fotosDe[r.id] || [] }))
  };
  // os onze fogões da Linha Colors têm um apelido fixo (zilda, carlos...) usado nas faixas da abertura
  const apelido = new Map(COLORS.map(c => [c[2], c[0]]));
  state.catalogo.produtos.forEach(p => { if (p.cat === 'colors' && apelido.has(p.codigo)) p.leg = apelido.get(p.codigo); });
  const m = state.catalogo.produtos.find(p => p.leg && p.leg === ui.modelo); if (m) ui.modelo = m.id;
  espelho.catalogo = clone(state.catalogo);
  state.pronto = true;
}
async function carregarConteudo() {
  const base = inicial().conteudo, logado = !!papelAtual();
  const [linhas, cfg, pixPublico] = await Promise.all([SB.sel('conteudo_site', 'select=chave,valor'), logado ? SB.sel('configuracoes', 'select=chave,valor') : [], logado ? null : SB.rpc('pix_da_loja_site').catch(() => null)]);
  const site = (linhas.find(l => l.chave === 'site') || {}).valor, c = { ...base, ...(site || {}) };
  const de = k => (cfg.find(x => x.chave === k) || {}).valor;
  c.pix = { chave: '', favorecido: '', banco: '', ...((logado ? de('pix') : pixPublico) || {}) };
  c.loja = logado && de('loja_site') ? { ativa: !!de('loja_site').ativa, acrescimo: Number(de('loja_site').acrescimo) || 0 } : { ativa: state.catalogo.produtos.some(p => p.vit != null), acrescimo: null };
  state.conteudo = c; atualizarLinhas();
  espelho.conteudo = clone(state.conteudo);
}
async function carregarContas() {
  if (!SB.id) { state.usuarios = []; espelho.usuarios = []; return; }
  const [perfis, lib] = await Promise.all([selTudo('perfis', 'select=*&order=criado_em.asc,id.asc'), selTudo('catalogo_loja', 'select=*&order=loja_id.asc,produto_id.asc')]);
  const libDe = {}; lib.forEach(x => { (libDe[x.loja_id] = libDe[x.loja_id] || {})[x.produto_id] = Number(x.preco); });
  state.usuarios = perfis.map(r => ({ id: r.id, nome: r.nome, email: r.email || '', login: r.login || '', papel: r.papel, empresa: r.empresa || '', doc: r.documento || '', cidade: r.cidade || '', contato: r.contato || '',
    vendedorResp: r.vendedor_id || '', ativo: !!r.ativo, senha: true, liberados: r.papel === 'ecommerce' ? (libDe[r.id] || {}) : undefined }));
  espelho.usuarios = clone(state.usuarios);
}
function pedidoDe(r, itens, anexos, parcelas) {
  const comp = anexos.filter(a => a.tipo === 'comprovante_pix').sort((a, b) => a.enviado_em < b.enviado_em ? 1 : -1)[0];
  const e = r.entrega;
  return { id: r.id, numero: Number(r.numero), criado: dataLocal(r.criado_em), origem: r.origem === 'interno' ? undefined : r.origem, vendedor: r.vendedor_id, acrescimo: r.acrescimo == null ? undefined : Number(r.acrescimo),
    cliente: { nome: r.cliente_nome, doc: r.cliente_doc || '', cidade: r.cliente_cidade || '', fone: r.cliente_telefone || '', email: r.cliente_email || '',
      endereco: e ? { cep: e.cep || '', rua: e.rua || '', numero: e.numero || '', compl: e.complemento || e.compl || '', bairro: e.bairro || '', cidade: e.cidade || '', uf: e.uf || '' } : undefined },
    itens: itens.map(i => ({ produto: i.produto_id, codigo: i.codigo || '', nome: i.descricao, qtd: i.quantidade, preco: Number(i.preco_unit) })), obs: r.observacoes || '',
    pagamento: r.forma_pagamento === 'boleto' ? { forma: 'boleto', dias: r.boleto_dias || [], status: r.boleto_status, por: r.boleto_decidido_por, em: r.boleto_decidido_em ? dataLocal(r.boleto_decidido_em) : '', motivo: r.boleto_motivo || '',
      recebidas: parcelas.filter(p => p.recebida_em).map(p => p.dias) } : { forma: 'pix' },
    pix: { status: PIX_BD[r.pix_status], arquivo: comp ? comp.id : null, por: r.pix_conferido_por },
    etiquetas: anexos.filter(a => a.tipo === 'etiqueta_envio').sort((a, b) => a.enviado_em < b.enviado_em ? -1 : 1).map(a => a.id), envio: ENVIO_BD[r.envio_status] };
}
async function carregarPedidos() {
  if (!papelAtual()) { state.pedidos = []; espelho.pedidos = []; return carregarPedidosDoSite(); }
  const [peds, itens, anexos, parcelas] = await Promise.all([selTudo('pedidos', 'select=*&order=numero.desc'), selTudo('itens_pedido', 'select=*&order=id.asc'), selTudo('anexos', 'select=*&order=enviado_em.asc,id.asc'), selTudo('parcelas_boleto', 'select=*&order=pedido_id.asc,numero.asc')]);
  const por = (l, k) => { const m = {}; l.forEach(x => (m[x[k]] = m[x[k]] || []).push(x)); return m; };
  const it = por(itens, 'pedido_id'), an = por(anexos, 'pedido_id'), pa = por(parcelas, 'pedido_id');
  const locais = {}; Object.entries(state.arquivos).forEach(([k, m]) => { if (m.local) locais[k] = m; });       // arquivos escolhidos e ainda não enviados continuam na tela
  state.arquivos = locais;
  anexos.forEach(a => { state.arquivos[a.id] = { id: a.id, nome: a.nome_original, tipo: a.mime, tamanho: Number(a.tamanho_bytes), em: a.enviado_em, guardado: true, bucket: a.bucket, caminho: a.caminho, por: a.enviado_por }; });
  state.pedidos = peds.map(r => pedidoDe(r, it[r.id] || [], an[r.id] || [], pa[r.id] || []));
  espelho.pedidos = clone(state.pedidos); espelho.arquivos = clone(state.arquivos);
  await carregarPedidosDoSite();
}
// Loja do site: os pedidos feitos neste aparelho ficam anotados aqui (state.daqui); o andamento vem do servidor.
function lerPedidosDoSite() { try { return JSON.parse(localStorage.getItem(LS_SITE)) || []; } catch (e) { return []; } }
function guardarPedidosDoSite(l) { try { localStorage.setItem(LS_SITE, JSON.stringify(l.slice(0, 30))); } catch (e) { } }
async function andamentoDoSite(numero, doc) { return SB.rpc('acompanhar_pedido_site', { p_numero: numero, p_documento: doc }); }
function pedidoDoSite(nota, a) {
  return { id: 'site-' + nota.numero, numero: nota.numero, chave: nota.chave || null, criado: a ? dataLocal(a.criado_em) : nota.criado, origem: 'site', vendedor: null, acrescimo: nota.acrescimo,
    cliente: nota.cliente || { nome: 'Pedido nº ' + nota.numero, doc: nota.doc },
    itens: a ? a.itens.map(i => ({ produto: null, codigo: i.codigo || '', nome: i.descricao, qtd: i.quantidade, preco: Number(i.preco_unit) })) : (nota.itens || []), obs: nota.obs || '',
    pagamento: { forma: 'pix' }, pix: { status: a ? PIX_BD[a.pix] : 'sem', arquivo: null, nomeComp: nota.comprovante || '' }, etiquetas: [], envio: a ? ENVIO_BD[a.envio] : 'aguardando' };
}
async function carregarPedidosDoSite() {
  const notas = lerPedidosDoSite();
  const l = await Promise.all(notas.map(n => andamentoDoSite(n.numero, n.doc).then(a => a ? pedidoDoSite(n, a) : null).catch(() => pedidoDoSite(n, null))));
  state.daqui = l.filter(Boolean);
}
async function recarregar(parte) {
  if (parte === 'catalogo') { await carregarCatalogo(); await carregarConteudo(); }
  else if (parte === 'conteudo') { await carregarCatalogo(); await carregarConteudo(); }      // o acréscimo da loja muda os preços do site
  else if (parte === 'usuarios') await carregarContas();
  else if (parte === 'pedidos') await carregarPedidos();
}
async function carregarTudo() {
  await carregarContas();                 // primeiro: quem é a pessoa e qual o perfil dela
  await carregarCatalogo();
  await Promise.all([carregarConteudo(), carregarPedidos()]);
}

/* ---------- arquivos ---------- */
const Files = {
  mem: {}, carregando: {}, LIM: 170 * 1024,
  // guarda o arquivo escolhido; ele sobe para o servidor quando o pedido (ou o produto) é gravado
  async put(file, { imagem = false } = {}) {
    let blob = file, nome = file.name || 'arquivo', tipo = file.type || (/\.pdf$/i.test(file.name || '') ? 'application/pdf' : 'application/octet-stream');
    const paraJpeg = async (lado, limite) => { blob = await reduzirImagem(file, lado, limite); tipo = 'image/jpeg'; nome = nome.replace(/\.[^.]+$/, '') + '.jpg'; };
    if (imagem) await paraJpeg(1000, this.LIM);
    else if (tipo.startsWith('image/') && (blob.size > 900 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(tipo))) {     // foto grande ou em formato que o servidor não guarda (HEIC, GIF, BMP)
      try { await paraJpeg(2000, 900 * 1024); } catch (e) { if (!['image/jpeg', 'image/png', 'image/webp'].includes(tipo)) throw new Error('Não foi possível ler esta imagem. Envie em JPG, PNG ou PDF.'); blob = file; }
    }
    if (blob.size > 9.5 * 1024 * 1024) throw new Error('O arquivo passa de 10 MB.');
    const id = 'loc-' + uid(), meta = { id, nome, tipo, tamanho: blob.size, em: new Date().toISOString(), guardado: true, local: true };
    this.mem[id] = { blob, url: URL.createObjectURL(blob) }; state.arquivos[id] = meta;
    return meta;
  },
  async get(id) {
    if (this.mem[id]) return this.mem[id];
    const m = state.arquivos[id]; if (!m || !m.caminho) return null;
    try { const blob = await SB.baixar(m.bucket, m.caminho); return (this.mem[id] = { blob, url: URL.createObjectURL(blob) }); } catch (e) { return null; }
  },
  urlSync(id) { return this.mem[id] ? this.mem[id].url : TRANSP; },
  remove(id) { const m = state.arquivos[id]; if (m && m.local) { delete state.arquivos[id]; delete this.mem[id]; } else if (m) delete state.arquivos[id]; },
  // sobe um arquivo local para o bucket privado e registra o anexo no pedido
  async anexar(idLocal, pedidoId, tipoAnexo) {
    const m = state.arquivos[idLocal], f = this.mem[idLocal]; if (!m || !f) throw new Error('O arquivo escolhido se perdeu. Anexe de novo.');
    const caminho = `pedidos/${pedidoId}/${uid()}-${nomeSeguro(m.nome)}`;
    await SB.enviar('vendas', caminho, f.blob, m.tipo);
    await SB.ins('anexos', [{ tipo: tipoAnexo, bucket: 'vendas', caminho, nome_original: m.nome, mime: m.tipo, tamanho_bytes: m.tamanho, pedido_id: pedidoId, enviado_por: SB.id }]);
    delete state.arquivos[idLocal];
  },
  // sobe uma foto para o bucket público e devolve a referência que as telas usam
  async publicar(idLocal, pasta) {
    const m = state.arquivos[idLocal], f = this.mem[idLocal]; if (!m || !f) throw new Error('A foto escolhida se perdeu. Envie de novo.');
    const caminho = `${pasta}/${uid()}-${nomeSeguro(m.nome)}`;
    await SB.enviar('publico', caminho, f.blob, m.tipo); delete state.arquivos[idLocal];
    return caminho;
  }
};

/* ---------- gravação: manda só a diferença ---------- */
// Uma coisa de cada vez: gravações e releituras entram numa fila. Enquanto a fila anda, os cliques novos esperam
// (quandoLivre) e só são aplicados sobre os dados já relidos — assim nenhum clique é perdido nem grava por cima de dado velho.
const pendente = new Set(); let sincronizando = false, ocupados = 0, fila = Promise.resolve();
function naFila(fn) { ocupados++; fila = fila.then(fn).catch(() => { }).finally(() => { ocupados--; }); return fila; }
async function quandoLivre() { while (ocupados) await fila; }
function salvar(parte) {
  if (parte === 'arquivos') return;
  pendente.add(parte); naFila(rodarSync);
}
async function rodarSync() {
  if (sincronizando) return;
  sincronizando = true;
  try {
    while (pendente.size) {
      const parte = [...pendente][0]; pendente.delete(parte);
      try { await SYNC[parte](); } catch (e) { toast(msgErro(e)); }
      try { await recarregar(parte); } catch (e) { }
      redesenhar();
    }
  } finally { sincronizando = false; }
}
const SYNC = {
  async catalogo() {
    const antes = espelho.catalogo, agora = state.catalogo;
    // categorias
    for (const [i, c] of agora.categorias.entries()) {
      const a = antes.categorias.find(x => x.id === c.id);
      if (!a) { const r = await SB.ins('categorias', [{ nome: c.nome, slug: slugDe(c.nome) + '-' + uid().slice(-4), ativa: c.ativa !== false, ordem: i + 1 }]); c.uuid = r[0].id; }
      else if (a.nome !== c.nome || a.ativa !== c.ativa) await SB.upd('categorias', { id: a.uuid }, { nome: c.nome, ativa: !!c.ativa });
    }
    for (const a of antes.categorias) if (!agora.categorias.some(c => c.id === a.id)) await SB.del('categorias', { id: a.uuid });
    const catUuid = id => (agora.categorias.find(c => c.id === id) || {}).uuid;
    // produtos
    const campos = p => ({ categoria_id: catUuid(p.cat), nome: p.nome, codigo: (p.codigo || '').trim() || null, cor: p.cor || null, cor_hex: /^#[0-9A-Fa-f]{6}$/.test(p.hex || '') ? p.hex : null, frase: p.slogan || null,
      historia: p.historia || null, especificacoes: p.specs || [], grupo: p.grupo || null, grelha: p.grelha || null, subgrupo: p.sub || null, mostrar_preco: !!p.mostrar_preco, ativo: !!p.ativo });
    const novoId = {};
    for (const p of agora.produtos) {
      const a = antes.produtos.find(x => x.id === p.id);
      let id = p.id;
      if (!a) { const r = await SB.ins('produtos', [{ ...campos(p), ordem: 9000 }]); id = novoId[p.id] = r[0].id; }
      else if (!igual(campos(a), campos(p))) await SB.upd('produtos', { id }, campos(p));
      if (!a || (a.preco || 0) !== (p.preco || 0)) { if (p.preco > 0) await SB.ins('precos', [{ produto_id: id, valor: p.preco }], { conflito: 'produto_id' }); else if (a && a.preco > 0) await SB.del('precos', { produto_id: id }); }
      if (!igual(a ? a.fotos : [], p.fotos)) {
        const refs = [];
        for (const f of p.fotos) refs.push(f.startsWith('file:') ? await Files.publicar(f.slice(5), 'produtos/' + id) : f.startsWith('pub:') ? f.slice(4) : f);
        if (a) for (const f of a.fotos) if (f.startsWith('pub:') && !refs.includes(f.slice(4))) { try { await SB.apagar('publico', f.slice(4)); } catch (e) { } }
        if (a) await SB.del('fotos_produto', { produto_id: id });
        if (refs.length) await SB.ins('fotos_produto', refs.map((caminho, ordem) => ({ produto_id: id, caminho, ordem })));
      }
    }
    for (const p of agora.produtos) {       // fornos por último: o forno pode ter acabado de ser criado
      const a = antes.produtos.find(x => x.id === p.id), id = novoId[p.id] || p.id, lista = (p.fornos || []).map(f => novoId[f] || f);
      if (igual(a ? a.fornos : [], lista)) continue;
      if (a) await SB.del('fornos_do_fogao', { fogao_id: id });
      if (lista.length) await SB.ins('fornos_do_fogao', lista.map((forno_id, ordem) => ({ fogao_id: id, forno_id, ordem: ordem + 1 })));
    }
    for (const a of antes.produtos) if (!agora.produtos.some(p => p.id === a.id)) {
      await SB.del('produtos', { id: a.id });
      for (const f of a.fotos) if (f.startsWith('pub:')) { try { await SB.apagar('publico', f.slice(4)); } catch (e) { } }
    }
  },
  async usuarios() {
    for (const u of state.usuarios) { const a = (espelho.usuarios || []).find(x => x.id === u.id); if (a && a.ativo !== u.ativo) await SB.upd('perfis', { id: u.id }, { ativo: !!u.ativo }); }
  },
  async conteudo() {
    const c = state.conteudo, a = espelho.conteudo, adm = papelAtual() === 'admin';
    if (!adm) return;
    // fotos novas da galeria e das linhas sobem para o bucket público
    for (let i = 0; i < c.galeria.length; i++) if (c.galeria[i].startsWith('file:')) c.galeria[i] = 'pub:' + await Files.publicar(c.galeria[i].slice(5), 'site');
    for (const l of c.linhas) for (let i = 0; i < (l.fotos || []).length; i++) if (l.fotos[i].startsWith('file:')) l.fotos[i] = 'pub:' + await Files.publicar(l.fotos[i].slice(5), 'site');
    // fotos que saíram do site deixam de ocupar espaço no Storage
    const usadas = new Set([...c.galeria, ...c.linhas.flatMap(l => l.fotos || [])]);
    for (const f of [...a.galeria, ...a.linhas.flatMap(l => l.fotos || [])]) if (f.startsWith('pub:') && !usadas.has(f)) { try { await SB.apagar('publico', f.slice(4)); } catch (e) { } }
    const { pix, loja, ...site } = c, { pix: pixA, loja: lojaA, ...siteA } = a;
    if (!igual(site, siteA)) await SB.ins('conteudo_site', [{ chave: 'site', valor: site, atualizado_por: SB.id }], { conflito: 'chave' });
    if (!igual(pix, pixA)) await SB.ins('configuracoes', [{ chave: 'pix', valor: pix }], { conflito: 'chave' });
    if (!igual(loja, lojaA)) await SB.ins('configuracoes', [{ chave: 'loja_site', valor: { ativa: !!loja.ativa, acrescimo: Number(loja.acrescimo) || 0 } }], { conflito: 'chave' });
  },
  async pedidos() {
    if (!papelAtual()) return;
    const adm = papelAtual() === 'admin';
    for (const p of state.pedidos) {
      const a = (espelho.pedidos || []).find(x => x.id === p.id); if (!a) continue;
      // arquivos novos: sobem e viram anexos (o banco põe o pedido "em análise" sozinho)
      let subiuComp = false;
      if (p.pix.arquivo && p.pix.arquivo !== a.pix.arquivo && (state.arquivos[p.pix.arquivo] || {}).local) { await Files.anexar(p.pix.arquivo, p.id, 'comprovante_pix'); subiuComp = true; }
      for (const e of p.etiquetas) if (!a.etiquetas.includes(e) && (state.arquivos[e] || {}).local) await Files.anexar(e, p.id, 'etiqueta_envio');
      for (const e of a.etiquetas) if (!p.etiquetas.includes(e)) { const m = espelho.arquivos[e]; if (m) { try { await SB.apagar(m.bucket, m.caminho); } catch (x) { } await SB.del('anexos', { id: e }); } }
      // situação do pedido
      const v = {};
      if (p.pagamento.forma !== a.pagamento.forma) { v.forma_pagamento = p.pagamento.forma; if (p.pagamento.forma === 'boleto') v.boleto_dias = p.pagamento.dias; }
      if (p.pagamento.forma === 'boleto' && a.pagamento.forma === 'boleto') {
        if (!igual(p.pagamento.dias, a.pagamento.dias)) v.boleto_dias = p.pagamento.dias;
        if (p.pagamento.status !== a.pagamento.status) { v.boleto_status = p.pagamento.status; if (p.pagamento.status === 'recusado') v.boleto_motivo = p.pagamento.motivo || null; }
      }
      if (p.pix.status !== a.pix.status && !(subiuComp && p.pix.status === 'analise') && (adm || p.pix.status === 'sem')) v.pix_status = PIX_TELA[p.pix.status];
      if (p.envio !== a.envio) v.envio_status = ENVIO_TELA[p.envio];
      if (Object.keys(v).length) { const r = await SB.upd('pedidos', { id: p.id }, v); if (!r.length) throw new Error('Você não tem permissão para alterar este pedido.'); }
      // parcelas recebidas (depois da aprovação, que é quando as parcelas nascem)
      if (p.pagamento.forma === 'boleto' && a.pagamento.forma === 'boleto') {
        const antesR = a.pagamento.recebidas || [], agoraR = p.pagamento.recebidas || [];
        for (const d of p.pagamento.dias) if (antesR.includes(d) !== agoraR.includes(d)) await SB.upd('parcelas_boleto', { pedido_id: p.id, dias: d }, { recebida_em: agoraR.includes(d) ? new Date().toISOString() : null });
      }
    }
  }
};

/* ---------- o que nasce no servidor ---------- */
const NUCLEO = {
  // login: confere a senha no servidor e só então carrega o que o perfil pode ver
  async entrar(identificador, senha, portal) {
    let email = identificador;
    if (portal === 'ecommerce' && !identificador.includes('@')) {
      email = await SB.rpc('email_do_login', { p_login: identificador });
      if (!email) { const e = new Error('Invalid login credentials'); e.code = 'invalid_credentials'; throw e; }
    }
    await SB.entrar(email, senha);
    await carregarContas();
    const u = state.usuarios.find(x => x.id === SB.id);
    if (!u || !u.ativo) { await SB.sair(); state.usuarios = []; throw new Error('Esta conta está inativa ou ainda não foi liberada. Fale com a administração da JCN.'); }
    if (portalDe(u) !== portal) { await SB.sair(); state.usuarios = []; throw new Error('Esta conta entra pela aba ' + PORTAIS[portalDe(u)][0] + '.'); }
    sessao = u.id;
    await carregarCatalogo(); await Promise.all([carregarConteudo(), carregarPedidos()]);
    return u;
  },
  async sair() { await SB.sair(); sessao = null; state.usuarios = []; state.pedidos = []; state.arquivos = {}; await carregarCatalogo(); await Promise.all([carregarConteudo(), carregarPedidos()]); },
  // pedido do portal de vendas (vendedor, representante, administrador) ou da loja de e-commerce
  async lancarPedido({ origem, cliente, itens, obs, forma, dias, comprovante, etiquetas = [] }) {
    // uma chamada só: ou o pedido entra com todos os itens, ou não entra nada. O valor de cada item é posto pelo banco
    // (tabela de preços, ou o valor liberado para a loja); só o da administração é aceito como veio.
    const ped = await SB.rpc('lancar_pedido', {
      p_pedido: { origem, cliente_nome: cliente.nome, cliente_doc: cliente.doc || '', cliente_cidade: cliente.cidade || '', observacoes: obs || '', forma_pagamento: forma === 'boleto' ? 'boleto' : 'pix', boleto_dias: forma === 'boleto' ? dias : null },
      p_itens: itens.map(i => ({ produto_id: i.produto, quantidade: i.qtd, preco_unit: i.preco })) });
    const falhas = [];
    if (comprovante) { try { await Files.anexar(comprovante, ped.id, 'comprovante_pix'); } catch (e) { falhas.push('comprovante'); } }
    for (const e of etiquetas) { try { await Files.anexar(e, ped.id, 'etiqueta_envio'); } catch (x) { falhas.push('etiqueta'); } }
    await carregarPedidos();
    return { id: ped.id, numero: Number(ped.numero), falhas };
  },
  // pedido da loja do site: o visitante não grava em tabela nenhuma, só chama esta função do banco
  async pedidoDoSite(c, itens, comprovante) {
    const cliente = { nome: c.nome.trim(), documento: c.doc.trim(), telefone: c.fone.trim(), email: c.email.trim(), observacoes: c.obs.trim(),
      entrega: { cep: soDig(c.cep).replace(/(\d{5})(\d{3})/, '$1-$2'), rua: c.rua.trim(), numero: c.numero.trim(), complemento: c.compl.trim(), bairro: c.bairro.trim(), cidade: c.cidade.trim(), uf: c.uf } };
    const r = await SB.rpc('criar_pedido_site', { p_cliente: cliente, p_itens: itens.map(i => ({ produto_id: i.p.id, quantidade: i.qtd })) });
    const ped = Array.isArray(r) ? r[0] : r;
    const nota = { numero: Number(ped.numero), chave: ped.chave, doc: soDig(c.doc), criado: hojeISO(), acrescimo: lojaCfg().acrescimo, obs: cliente.observacoes,
      cliente: { nome: cliente.nome, doc: cliente.documento, cidade: `${cliente.entrega.cidade}, ${cliente.entrega.uf}`, fone: cliente.telefone, email: cliente.email, endereco: { ...cliente.entrega, compl: cliente.entrega.complemento } },
      itens: itens.map(({ p, preco, qtd }) => ({ produto: p.id, codigo: p.codigo, nome: rotulo(p), qtd, preco })) };
    let falhou = false;
    try { nota.comprovante = await NUCLEO.comprovanteDoSite(nota, comprovante); } catch (e) { falhou = true; }
    guardarPedidosDoSite([nota, ...lerPedidosDoSite().filter(n => n.numero !== nota.numero)]);
    await carregarPedidos();
    return { numero: nota.numero, id: 'site-' + nota.numero, falhou };
  },
  async comprovanteDoSite(nota, idLocal) {
    const m = state.arquivos[idLocal], f = Files.mem[idLocal]; if (!m || !f) throw new Error('O comprovante escolhido se perdeu. Anexe de novo.');
    const caminho = `site/${nota.chave}/${uid()}-${nomeSeguro(m.nome)}`;
    await SB.enviar('vendas', caminho, f.blob, m.tipo);
    await SB.rpc('anexar_comprovante_site', { p_numero: nota.numero, p_chave: nota.chave, p_caminho: caminho, p_nome: m.nome, p_mime: m.tipo, p_tamanho: m.tamanho });
    delete state.arquivos[idLocal];
    return m.nome;
  },
  // novo login (vendedor, representante, administrador ou loja). Quem está logado continua logado.
  async criarAcesso({ email, senha, perfil, liberados }) {
    const regras = await SB.regras().catch(() => null);
    if (regras && regras.mailer_autoconfirm === false) throw new Error('Para criar logins por aqui, desligue "Confirm email" no Supabase (Authentication, Sign In / Providers, Email) e tente de novo.');
    let novo;
    const recusa = e => new Error(/password/i.test(e.message + ' ' + e.code) ? 'O servidor recusou a senha: use pelo menos 8 caracteres, com letras e números.'
      : /email.*invalid|invalid.*email/i.test(e.message + ' ' + e.code) ? 'O servidor não aceitou o endereço ' + email + '. Confira o e-mail (ou o "dominio_dos_logins" em config.js).'
      : /rate|too many|429/i.test(e.message + ' ' + e.status) ? 'Muitos cadastros em pouco tempo. Espere um minuto e tente de novo.' : msgErro(e));
    const ja = e => /already|registered|exists/i.test(e.message + ' ' + e.code);
    try { novo = await SB.criarLogin(email, senha); }
    catch (e) {
      if (!ja(e)) throw recusa(e);
      // já existe um login com este e-mail. Se ele tem conta, o banco recusa; se está "solto" (cadastro que parou no meio,
      // ou alguém que se cadastrou por fora), o banco apaga e criamos um login novo — o antigo nunca é aproveitado.
      await SB.rpc('liberar_email', { p_email: email });
      try { novo = await SB.criarLogin(email, senha); } catch (e2) { throw ja(e2) ? new Error('Este e-mail está sendo usado em outro cadastro agora. Tente de novo em instantes.') : recusa(e2); }
    }
    await SB.ins('perfis', [{ id: novo.id, email, ...perfil }]);
    if (liberados) await NUCLEO.gravarLiberados(novo.id, {}, liberados);
    await carregarContas();
    return novo.id;
  },
  async gravarLiberados(lojaId, antes, agora) {
    const tirar = Object.keys(antes).filter(k => agora[k] == null), por = Object.keys(agora).filter(k => antes[k] !== agora[k]);
    for (let i = 0; i < tirar.length; i += 40) await SB.del('catalogo_loja', { loja_id: lojaId, produto_id: tirar.slice(i, i + 40) });     // em partes: o endereço do pedido tem tamanho máximo
    if (por.length) await SB.ins('catalogo_loja', por.map(k => ({ loja_id: lojaId, produto_id: k, preco: agora[k] })), { conflito: 'loja_id,produto_id' });
  },
  async salvarLoja(u, senha, antigo) {
    const perfil = { nome: u.nome, login: u.login, papel: 'ecommerce', empresa: u.nome, documento: u.doc || null, cidade: u.cidade || null, contato: u.contato || null, vendedor_id: u.vendedorResp, ativo: !!u.ativo };
    if (!antigo) return NUCLEO.criarAcesso({ email: enderecoDaLoja(u.login), senha, perfil, liberados: u.liberados });
    const { login, papel, ...novoP } = perfil;                      // o login e o perfil não mudam depois de criados
    if (papelAtual() !== 'admin') delete novoP.vendedor_id;
    const era = { nome: antigo.nome, empresa: antigo.nome, documento: antigo.doc || null, cidade: antigo.cidade || null, contato: antigo.contato || null, vendedor_id: antigo.vendedorResp, ativo: !!antigo.ativo };
    const muda = {}; Object.keys(novoP).forEach(k => { if (novoP[k] !== era[k]) muda[k] = novoP[k]; });       // só o que mudou nesta tela: não desfaz o que outra pessoa alterou
    if (Object.keys(muda).length) { const r = await SB.upd('perfis', { id: antigo.id }, muda); if (!r.length) throw new Error('Você não tem permissão para alterar esta conta.'); }
    await NUCLEO.gravarLiberados(antigo.id, antigo.liberados || {}, u.liberados);
    if (senha) await SB.rpc('definir_senha', { p_usuario: antigo.id, p_senha: senha });
    await carregarContas();
    return antigo.id;
  },
  async definirSenha(id, senha) { await SB.rpc('definir_senha', { p_usuario: id, p_senha: senha }); }
};

// O que as telas chamam: cada operação entra na mesma fila das gravações (uma de cada vez).
// Por dentro, as operações usam NUCLEO direto, para não esperar por si mesmas.
const API = {};
Object.keys(NUCLEO).forEach(k => { API[k] = (...a) => { let r; return naFila(() => (r = NUCLEO[k](...a))).then(() => r); }; });

/* ---------- atualização periódica: o que outra pessoa gravou aparece sem recarregar a página ---------- */
let tRelogio = null;
function ligarRelogio() {
  clearInterval(tRelogio);
  tRelogio = setInterval(() => {
    if (document.hidden || ocupados) return;
    const a = document.activeElement;
    if (a && a.matches && a.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea,select')) return;      // não mexe na tela de quem está digitando
    naFila(async () => {
      const antes = JSON.stringify([state.pedidos, state.usuarios, state.daqui]), dentro = !!sessao;
      try { if (dentro) await carregarContas(); await carregarPedidos(); } catch (e) { return; }
      if (dentro && sessao && !eu()) {            // a conta foi desativada enquanto a pessoa estava dentro
        try { await NUCLEO.sair(); } catch (e) { sessao = null; }
        ui.erro = 'Esta conta foi desativada. Fale com a administração da JCN.'; fecharDrawer(); if (!$('#app').hidden) renderApp(); return;
      }
      if (antes !== JSON.stringify([state.pedidos, state.usuarios, state.daqui])) redesenhar();
    });
  }, (CONFIG.segundos_entre_atualizacoes || 30) * 1000);
}

/* ---------- início ---------- */
state = inicial();
montarPalco(); renderSite(); prepararScroll();
try { ui.view = sessionStorage.getItem('jcn-tela') || null; } catch (e) { }
// a sessão caiu no servidor (senha trocada, conta desativada, muito tempo sem uso): volta para a tela de login
SB.aoPerderSessao = () => {
  if (!sessao) return;
  sessao = null; state.usuarios = []; state.pedidos = []; state.arquivos = {}; ui.erro = 'Sua sessão terminou. Entre de novo.';
  fecharDrawer(); if (!$('#app').hidden) renderApp();
  carregarCatalogo().then(carregarConteudo).then(redesenhar).catch(() => { });
};
(async () => {
  let naArea = false; try { naArea = sessionStorage.getItem('jcn-area') === '1'; } catch (e) { }
  try {
    if (await SB.sessaoValida()) {                       // a pessoa já tinha entrado neste aparelho
      await carregarContas();
      const u = state.usuarios.find(x => x.id === SB.id && x.ativo);
      if (u) {
        sessao = u.id; await carregarCatalogo(); await Promise.all([carregarConteudo(), carregarPedidos()]); ligarRelogio();
        if (naArea) abrirApp(); else redesenhar();
        return;
      }
      await SB.sair(); state.usuarios = [];
    }
    await carregarCatalogo(); await Promise.all([carregarConteudo(), carregarPedidos()]);
    redesenhar(); ligarRelogio();
  } catch (e) { toast(e && e.rede ? e.message : 'Não foi possível carregar os dados agora. Atualize a página em alguns instantes.'); }
})();

})();
