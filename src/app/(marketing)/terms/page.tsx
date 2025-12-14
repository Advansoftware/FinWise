// src/app/(marketing)/terms/page.tsx
import { Container, Typography, Box, Paper, Link as MuiLink, Stack, Divider } from "@mui/material";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso - Gastometria",
  description: "Leia os Termos de Uso do Gastometria para entender as regras de uso da plataforma.",
};

export default function TermsOfUsePage() {
  const lastUpdated = "14 de Dezembro de 2024";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Link href="/" passHref>
          <MuiLink
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              mb: 4,
              color: "text.secondary",
              textDecoration: "none",
              "&:hover": { color: "primary.main" },
            }}
          >
            <ArrowLeft size={16} />
            Voltar ao início
          </MuiLink>
        </Link>

        <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 3 }}>
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
            Termos de Uso
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Última atualização: {lastUpdated}
          </Typography>

          <Stack spacing={4}>
            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                1. Aceitação dos Termos
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ao acessar e usar o Gastometria, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                2. Descrição do Serviço
              </Typography>
              <Typography variant="body1" color="text.secondary">
                O Gastometria é uma plataforma de gestão financeira pessoal que oferece:
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                <ul>
                  <li>Controle de receitas e despesas</li>
                  <li>Gerenciamento de carteiras e contas</li>
                  <li>Criação de orçamentos e metas financeiras</li>
                  <li>Análises e relatórios financeiros</li>
                  <li>Recursos de inteligência artificial para insights</li>
                  <li>Parcelamentos e contas recorrentes</li>
                </ul>
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                3. Cadastro e Conta
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                <strong>3.1.</strong> Para utilizar o Gastometria, você deve criar uma conta fornecendo informações 
                verdadeiras e atualizadas.
                <br /><br />
                <strong>3.2.</strong> Você é responsável por manter a confidencialidade de sua senha e por todas as 
                atividades que ocorram em sua conta.
                <br /><br />
                <strong>3.3.</strong> Você deve nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.
                <br /><br />
                <strong>3.4.</strong> Você deve ter pelo menos 18 anos de idade para criar uma conta.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                4. Uso Aceitável
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ao usar o Gastometria, você concorda em <strong>não</strong>:
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                <ul>
                  <li>Violar qualquer lei ou regulamento aplicável</li>
                  <li>Tentar acessar contas de outros usuários</li>
                  <li>Usar o serviço para fins ilegais ou fraudulentos</li>
                  <li>Transmitir vírus, malware ou código malicioso</li>
                  <li>Sobrecarregar nossa infraestrutura</li>
                  <li>Fazer engenharia reversa ou copiar o software</li>
                  <li>Usar automação não autorizada (bots, scrapers)</li>
                </ul>
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                5. Propriedade Intelectual
              </Typography>
              <Typography variant="body1" color="text.secondary">
                <strong>5.1.</strong> O Gastometria e todo seu conteúdo, recursos e funcionalidades são de propriedade 
                exclusiva de seus criadores e estão protegidos por leis de direitos autorais e marcas registradas.
                <br /><br />
                <strong>5.2.</strong> Você mantém a propriedade de seus dados financeiros inseridos na plataforma.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                6. Planos e Pagamentos
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                <strong>6.1.</strong> O Gastometria oferece planos gratuitos e pagos com diferentes funcionalidades.
                <br /><br />
                <strong>6.2.</strong> Os preços dos planos podem ser alterados com aviso prévio de 30 dias.
                <br /><br />
                <strong>6.3.</strong> Pagamentos são processados por provedores terceiros de pagamento.
                <br /><br />
                <strong>6.4.</strong> Assinaturas são renovadas automaticamente até que sejam canceladas.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                7. Limitação de Responsabilidade
              </Typography>
              <Typography variant="body1" color="text.secondary">
                <strong>7.1.</strong> O Gastometria é fornecido "como está" e "conforme disponível", sem garantias 
                de qualquer tipo.
                <br /><br />
                <strong>7.2.</strong> Não nos responsabilizamos por decisões financeiras tomadas com base nas 
                informações do aplicativo. Recomendamos consultar profissionais financeiros qualificados.
                <br /><br />
                <strong>7.3.</strong> Não garantimos que o serviço será ininterrupto, livre de erros ou seguro.
                <br /><br />
                <strong>7.4.</strong> Nossa responsabilidade máxima será limitada ao valor pago pelo serviço 
                nos últimos 12 meses.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                8. Disponibilidade do Serviço
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Nos esforçamos para manter o serviço disponível 24/7, mas podemos realizar manutenções 
                programadas ou de emergência. Notificaremos sobre manutenções programadas com antecedência 
                quando possível.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                9. Encerramento de Conta
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                <strong>9.1.</strong> Você pode encerrar sua conta a qualquer momento através das configurações.
                <br /><br />
                <strong>9.2.</strong> Podemos suspender ou encerrar sua conta se você violar estes termos.
                <br /><br />
                <strong>9.3.</strong> Após o encerramento, seus dados serão excluídos conforme nossa Política de Privacidade.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                10. Alterações nos Termos
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. Notificaremos sobre 
                alterações significativas por e-mail ou aviso no aplicativo. O uso continuado do serviço 
                após as alterações constitui aceitação dos novos termos.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                11. Legislação Aplicável
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa 
                será resolvida nos tribunais competentes do Brasil.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                12. Contato
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Para dúvidas sobre estes Termos de Uso, entre em contato através do e-mail: 
                <strong> suporte@gastometria.com</strong>
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Gastometria. Todos os direitos reservados.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
            <Link href="/privacy" passHref>
              <MuiLink variant="body2" color="text.secondary">
                Política de Privacidade
              </MuiLink>
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
