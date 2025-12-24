import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Logo do Gastometria - Renderizado como widget customizado
/// Baseado no SVG do projeto web
class GastometriaLogo extends StatelessWidget {
  final double size;
  final bool showText;
  final Color? color;

  const GastometriaLogo({
    super.key,
    this.size = 80,
    this.showText = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final primaryColor = color ?? AppColors.primaryDark;
    final secondaryColor = AppColors.success; // chart-2 do tokens

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        CustomPaint(
          size: Size(size, size),
          painter: _LogoPainter(
            primaryColor: primaryColor,
            secondaryColor: secondaryColor,
          ),
        ),
        if (showText) ...[
          SizedBox(height: size * 0.15),
          Text(
            'Gastometria',
            style: TextStyle(
              fontSize: size * 0.25,
              fontWeight: FontWeight.bold,
              color: primaryColor,
            ),
          ),
        ],
      ],
    );
  }
}

class _LogoPainter extends CustomPainter {
  final Color primaryColor;
  final Color secondaryColor;

  _LogoPainter({
    required this.primaryColor,
    required this.secondaryColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 100;

    // Gradient shader
    final gradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [primaryColor, secondaryColor],
    );

    final gradientPaint = Paint()
      ..shader = gradient.createShader(
        Rect.fromLTWH(0, 0, size.width, size.height),
      );

    // Background shape (cofrinho)
    final backgroundPath = Path()
      ..moveTo(20 * scale, 90 * scale)
      ..cubicTo(
        20 * scale,
        90 * scale,
        20 * scale,
        20 * scale,
        50 * scale,
        10 * scale,
      )
      ..cubicTo(
        80 * scale,
        20 * scale,
        80 * scale,
        90 * scale,
        80 * scale,
        90 * scale,
      )
      ..close();

    final backgroundPaint = Paint()
      ..color = primaryColor.withValues(alpha: 0.1)
      ..style = PaintingStyle.fill;

    canvas.drawPath(backgroundPath, backgroundPaint);

    // Barras do gráfico
    final barRadius = Radius.circular(3 * scale);

    // Barra 1 (esquerda - menor)
    final bar1 = RRect.fromRectAndRadius(
      Rect.fromLTWH(28 * scale, 55 * scale, 12 * scale, 30 * scale),
      barRadius,
    );
    canvas.drawRRect(bar1, gradientPaint);

    // Barra 2 (centro - maior)
    final bar2 = RRect.fromRectAndRadius(
      Rect.fromLTWH(44 * scale, 35 * scale, 12 * scale, 50 * scale),
      barRadius,
    );
    canvas.drawRRect(bar2, gradientPaint);

    // Barra 3 (direita - média)
    final bar3 = RRect.fromRectAndRadius(
      Rect.fromLTWH(60 * scale, 45 * scale, 12 * scale, 40 * scale),
      barRadius,
    );
    canvas.drawRRect(bar3, gradientPaint);

    // Topo do cofrinho (semicírculo)
    final topPath = Path()
      ..moveTo(50 * scale, 15 * scale)
      ..arcToPoint(
        Offset(65 * scale, 30 * scale),
        radius: Radius.circular(15 * scale),
        clockwise: true,
      )
      ..lineTo(35 * scale, 30 * scale)
      ..arcToPoint(
        Offset(50 * scale, 15 * scale),
        radius: Radius.circular(15 * scale),
        clockwise: true,
      )
      ..close();

    final topFillPaint = Paint()
      ..color = primaryColor.withValues(alpha: 0.2)
      ..style = PaintingStyle.fill;

    final topStrokePaint = Paint()
      ..shader = gradient.createShader(
        Rect.fromLTWH(30 * scale, 10 * scale, 40 * scale, 25 * scale),
      )
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3 * scale
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(topPath, topFillPaint);
    canvas.drawPath(topPath, topStrokePaint);

    // Círculo central (moeda)
    canvas.drawCircle(
      Offset(50 * scale, 30 * scale),
      5 * scale,
      gradientPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Logo compacto (apenas ícone) para AppBar e outros lugares
class GastometriaLogoIcon extends StatelessWidget {
  final double size;
  final Color? color;

  const GastometriaLogoIcon({
    super.key,
    this.size = 32,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GastometriaLogo(
      size: size,
      showText: false,
      color: color,
    );
  }
}
