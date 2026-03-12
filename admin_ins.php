<?php    
  // Sistema de login simple por contraseña
  $password_correcta = "admin123"; // Cambia esta contraseña por la que desees
  $login_exitoso = false;
  
  // Verificar si se envió el formulario de login
  if (isset($_POST['password'])) {
    if ($_POST['password'] === $password_correcta) {
      $login_exitoso = true;
    } else {
      echo "<script>alert('Contraseña errónea. Inténtalo de nuevo.');</script>";
    }
  }
  
  // Si no hay login exitoso, mostrar formulario
  if (!$login_exitoso) {
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso al Reporte</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .login-form {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        .login-form h2 {
            color: #26508e;
            margin-bottom: 20px;
        }
        .login-form input[type="password"] {
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        .login-form input[type="submit"] {
            background-color: #26508e;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        .login-form input[type="submit"]:hover {
            background-color: #1e3f6f;
        }
    </style>
</head>
<body>
    <div class="login-form">
        <h2>Acceso al Reporte de Inscripciones</h2>
        <form method="POST" action="">
            <input type="password" name="password" placeholder="Ingrese la contraseña" required>
            <input type="submit" value="Acceder">
        </form>
    </div>
</body>
</html>
<?php   
    exit(); // Terminar ejecución si no hay login exitoso
  }
  
  // Si llegamos aquí, el login fue exitoso, continúa con el código original
  //include('/resources/php/session.php');
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //   session   session   session   session   session   session   session   session   session   session   session   session   session            //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  session_start();        
  // COMENTADO: Sistema de verificación de sesión original - ahora usamos login por contraseña
  /*
  if(                     ////   Aqui se autorizan las personas que pueden ver el reporte
       $_SESSION['username'] != 'armando' 
    && $_SESSION['username'] != 'mario'
    && $_SESSION['username'] != 'laura'
    && $_SESSION['username'] != 'alan'
  )
       header('location: index.php'); // Si no estan autorizadas se les redirige a la misma página
  */

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //   conexion   conexion   conexion   conexion   conexion   conexion   conexion   conexion   conexion   conexion   conexion   conexion          //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  include('mysqli_cn.php');
  $db=new mysqli_cn("localhost","winston_sistemas","winston201613","winston_general");
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //    variables                                                                                                                                 //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////    
  $ce_actual = date("m") > 1 ? date("y") - 3 : date("y") - 4;
  $ce_old = $ce_actual;
  $ce_actual = 23;
  $ce_old = 23;
  $cd = date('d-m-Y');  
  
  // Variable para definir el nivel de alumno (1=Maternal, 2=Kinder, 3=Primaria, 4=Secundaria)
  // Cambia este valor según el nivel que quieras mostrar en el reporte
  // MODIFICADO: Ahora mostrará todos los niveles
  $data = array('', 0); // 0 = Mostrar todos los niveles
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //   querys   querys   querys   querys   querys   querys   querys   querys   querys   querys   querys   querys   querys   querys   querys       //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  $reinscritos_estimados=$db->getResultSetJSON("select alumno_nivel,alumno_grado,count(*) from alumno where alumno_ciclo_escolar=$ce_old and alumno_status !=0 and alumno_nuevo_ingreso=0 group by alumno_nivel,alumno_grado order by alumno_nivel,alumno_grado asc;");  
  
  
    //$reinscritos_confirmados_diferido=$db->getResultSetJSON("select alumno_nivel,alumno_grado,count(*) from pago_detalle p left join alumno a on a.alumno_id=p.alumno_id where alumno_ciclo_escolar=$ce_old and (substr(pago_referencia,6,2)=12 OR substr(pago_referencia,6,2)=13) and substr(pago_referencia,8,2)=$ce_actual and pago_cancelado=0 and alumno_nuevo_ingreso = 0 and alumno_status!=5 and alumno_status!=0 and alumno_status!=2 and p.alumno_id is not null group by alumno_nivel,alumno_grado order by alumno_nivel,alumno_grado asc;"); */
    $reinscritos_confirmados_diferido=$db->getResultSetJSON("select alumno_nivel,alumno_grado,count(*) from pago_detalle p left join alumno a on a.alumno_id=p.alumno_id where alumno_ciclo_escolar=$ce_old and (substr(pago_referencia,6,2)=12 OR substr(pago_referencia,6,2)=13) and substr(pago_referencia,8,2)=$ce_actual and pago_cancelado=0 and alumno_nuevo_ingreso = 0 and alumno_status!=0 and p.alumno_id is not null group by alumno_nivel,alumno_grado order by alumno_nivel,alumno_grado asc;");
  

  //$reinscritos_confirmados_diferido=$db->getResultSetJSON("select alumno_nivel,alumno_grado,count(*) from pago_detalle p left join alumno a on a.alumno_id=p.alumno_id where alumno_ciclo_escolar=$ce_old and substr(pago_referencia,6,2)=11 and substr(pago_referencia,8,2)=$ce_actual and pago_cancelado=0 and alumno_status=1 and alumno_nuevo_ingreso=0 and p.alumno_id is not null group by alumno_nivel,alumno_grado order by alumno_nivel,alumno_grado asc;");

  $nuevo_ingreso=$db->getResultSetJSON("select alumno_nivel,alumno_grado,count(*) from alumno where alumno_ciclo_escolar=$ce_actual and alumno_status!=0 and alumno_nuevo_ingreso = 1 group by alumno_nivel,alumno_grado order by alumno_nivel,alumno_grado asc;");


  $nuevo_ingreso_confirmados=$db->getResultSetJSON("SELECT alumno_nivel,alumno_grado,count(*) FROM alumno WHERE alumno_ref IN (SELECT DISTINCT a.alumno_ref FROM pago_detalle p JOIN alumno a ON a.alumno_id=p.alumno_id WHERE substr(p.pago_referencia,6,4)=13$ce_actual AND pago_cancelado=0 AND alumno_status=1 AND alumno_nuevo_ingreso=1) GROUP BY alumno_nivel,alumno_grado ORDER BY alumno_nivel,alumno_grado ASC;");

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                DISMINUIR NIVEL
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //$reinscritos_estimados=disminuirGrado($reinscritos_estimados);
  //$reinscritos_confirmados_diferido=disminuirGrado($reinscritos_confirmados_diferido);
 //$reinscritos_confirmados_completo=disminuirGrado($reinscritos_confirmados_completo);

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //   REINSCRITOS   REINSCRITOS   REINSCRITOS   REINSCRITOS   REINSCRITOS   REINSCRITOS   REINSCRITOS   REINSCRITOS   REINSCRITOS   REINSCRITOS  //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
    array_unshift($reinscritos_confirmados_diferido, array(1,2,0)); //se agrgo esta linea porque ningun alumno pago diferido1 de maternalA
    array_unshift($reinscritos_confirmados_diferido, array(1,1,0)); //se agrgo esta linea porque ningun alumno pago diferido1 de maternalA
    
    $rietemp = array();
    foreach ($reinscritos_estimados as $reins) //todos los alumnos
      $rietemp[] = $reins;
    foreach ($reinscritos_confirmados_diferido as $reins) //para los que pagaron reinscripcion
      $riitemp[] = $reins;  
    

    $rie = cambiadeciclo($rietemp);    
    $rii = cambiadeciclo($riitemp);  

    //$reinscritos[nivel, grado, rie, rii, dif]
    $reinscritos = array();
    for ($i=0; $i < count($rie); $i++) { 
      $reinscritos[] = [$rie[$i][0], $rie[$i][1], $rie[$i][2], $rii[$i][2], $rie[$i][2]-$rii[$i][2]];
    }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //  INSCRITOS  INSCRITOS  INSCRITOS  INSCRITOS  INSCRITOS  INSCRITOS  INSCRITOS  INSCRITOS  INSCRITOS  INSCRITOS  INSCRITOS  INSCRITOS   //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    foreach($nuevo_ingreso as $reins_pendientes){
      $found=false;
      foreach($nuevo_ingreso_confirmados as $nuevos_pendientes){
        if($reins_pendientes[0]==$nuevos_pendientes[0]&&$reins_pendientes[1]==$nuevos_pendientes[1]){
          $inscritos[]=array($reins_pendientes[0],$reins_pendientes[1],$reins_pendientes[2],$nuevos_pendientes[2],($reins_pendientes[2]-$nuevos_pendientes[2]));
          $found=true;
          break;
        }
      }
      if(!$found)$inscritos[]=array($reins_pendientes[0],$reins_pendientes[1],$reins_pendientes[2],0,$reins_pendientes[2]);
    }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   PDF   //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  require("reportes/fpdf/fpdf.php");

  $pdf=new FPDF('P','mm',array(210,279));//P ó L
  $pdf->AddPage();

  $pdf->Image('reportes/resources/img/report.jpg',10,8,35);
  $pdf->Ln();
  $pdf->SetFont('Arial','',20);
  $pdf->Cell(90,6,"",'',0,'C',false);
  $pdf->Cell(90,6,'Inscripciones','',0,'R',false);
  $pdf->Ln(10);
  $pdf->Cell(90,6,"",'',0,'C',false);
  $pdf->Cell(90,6,'Nuevo Ingreso','',0,'R',false);
  $pdf->Ln(10);
  $pdf->Cell(90,6,"",'',0,'C',false);
  $pdf->Cell(90,6,"Ciclo Escolar ".getSchoolYear($ce_actual),'',0,'R',false);
  $pdf->Ln(10);
  $pdf->SetFont('Arial','',14);
  $pdf->Cell(90,6,"",'',0,'C',false);
  $pdf->Cell(90,6,get_Date($cd),'',0,'R',false);
  $pdf->Ln();
  $pdf->Ln(20);$pdf->SetTextColor(0,0,0);

  $pdf->SetTextColor(255,255,255);$pdf->SetFillColor(38,80,142);//COBALTO 38,80,142
  $pdf->SetFont('Arial','',7);

  $pdf->Cell(22,6,"NIVEL",'LRTB',0,'L',true);
  $pdf->Cell(20,6,"RI ESTIMADOS",'LRTB',0,'L',true);
   if(strtotime($cd) < strtotime(date("22-06-2020"))) //es la fecha en que se abre el segundo diferido
  $pdf->Cell(20,6,"RI DIF 1",'LRTB',0,'C',true);
  else
  $pdf->Cell(20,6,"RI INSCRITOS",'LRTB',0,'L',true);
  $pdf->Cell(20,6,"RI DIFERENCIA",'LRTB',0,'L',true);
  $pdf->Cell(20,6,"NI ESTIMADOS",'LRTB',0,'L',true);
  $pdf->Cell(20,6,"NI INSCRITOS",'LRTB',0,'L',true);
  $pdf->Cell(20,6,"NI DIFERENCIA",'LRTB',0,'L',true);
  $pdf->Cell(23,6,"TOTAL ESTIMADO",'LRTB',0,'L',true);
  $pdf->Cell(23,6,"TOTAL INSCRITOS",'LRTB',0,'L',true);
  $pdf->SetFont('Arial','',9);
  // $pdf->SetTextColor(0,0,0);$pdf->SetFillColor(168,168,168);//GRAY 168,168,168
  $pdf->SetTextColor(0,0,0);$pdf->SetFillColor(150,190,252);//BLUE 150,190,252
  $pdf->Ln();
  $total_estimados=0;
  $total_inscritos=0;
  $count=0;
  $begin=0;
  $alumno_nivel=$data[1]; //-- EDITABLE --
  // MODIFICADO: Eliminamos las restricciones de inicio para mostrar todos los niveles
  // if($alumno_nivel==3)$begin=5;
  // else if($alumno_nivel==4)$begin=11;

  $total=0;
  $level=0;
  $sum_ri_estimados=0;
  $sum_ri_inscritos=0;
  $sum_ni_estimados=0;
  $sum_ni_inscritos=0;
  $sum_ri_diferencia=0;
  $sum_ni_diferencia=0;
  $total_nivel_estimados=0;
  $total_nivel_inscritos=0;
  foreach($reinscritos as $row){
    $found=false;
    // MODIFICADO: Eliminamos la condición $count>=$begin para mostrar todos
    // if($count>=$begin){

      $sum_ri_estimados+=$row[2];
      $sum_ri_inscritos+=$row[3];
      if($row[0]>$level&&$row[0]>2){
        $sum_ri_estimados-=$row[2];
        $sum_ri_inscritos-=$row[3];
        $pdf->Cell(22,6,"TOTALES",'LRTB',0,'L',true);
        $pdf->Cell(20,6,$sum_ri_estimados,'LRTB',0,'C',false);
        $pdf->Cell(20,6,$sum_ri_inscritos,'LRTB',0,'C',false);
        $pdf->Cell(20,6,$sum_ri_diferencia,'LRTB',0,'C',true);
        $pdf->Cell(20,6,$sum_ni_estimados,'LRTB',0,'C',false);
        $pdf->Cell(20,6,$sum_ni_inscritos,'LRTB',0,'C',false);
        $pdf->Cell(20,6,$sum_ni_diferencia,'LRTB',0,'C',true);
        $pdf->Cell(23,6,$total_nivel_estimados,'LRTB',0,'C',true);
        $pdf->Cell(23,6,$total_nivel_inscritos,'LRTB',0,'C',true);
        $pdf->Ln();
        $pdf->Ln();
        $level=$row[0];
        $sum_ri_estimados=0;
        $sum_ri_inscritos=0;
        $sum_ni_estimados=0;
        $sum_ni_inscritos=0;
        $sum_ri_estimados+=$row[2];
        $sum_ri_inscritos+=$row[3];
        $sum_ri_diferencia=0;
        $sum_ni_diferencia=0;
        $total_nivel_estimados=0;
        $total_nivel_inscritos=0;
      }

      $pdf->Cell(22,6,getFullLevel($row[0],$row[1]),'LRTB',0,'L',true);
      $pdf->Cell(20,6,$row[2],'LRTB',0,'C',false);
      $pdf->Cell(20,6,$row[3],'LRTB',0,'C',false);
      $pdf->SetFillColor(54,116,210);//SOFT BLUE 54,116,210
      $pdf->SetTextColor(255,255,255);
      $pdf->Cell(20,6,$row[4],'LRTB',0,'C',true);
      $pdf->SetTextColor(0,0,0);
      $total_estimados=$row[2];
      $total_inscritos=$row[3];
      $sum_ri_diferencia+=$row[4];

      foreach($inscritos as $row_real){
        if($row[0]==$row_real[0]&&$row[1]==$row_real[1]){
          // echo $row_real[2]." => ".$row_real[3]." => ".$row_real[4];
          $pdf->Cell(20,6,$row_real[2],'LRTB',0,'C',false);
          $pdf->Cell(20,6,$row_real[3],'LRTB',0,'C',false);$pdf->SetTextColor(255,255,255);
          $pdf->Cell(20,6,$row_real[4],'LRTB',0,'C',true);
          $total_estimados+=$row_real[2];
          $total_inscritos+=$row_real[3];
          $sum_ni_estimados+=$row_real[2];
          $sum_ni_inscritos+=$row_real[3];
          $sum_ni_diferencia+=$row_real[4];
          $found=true;
        }
      }
      if(!$found){
        $pdf->Cell(20,6,0,'LRTB',0,'C',false);
        $pdf->Cell(20,6,0,'LRTB',0,'C',false);$pdf->SetTextColor(255,255,255);
        $pdf->Cell(20,6,0,'LRTB',0,'C',true);
      }

      $pdf->SetTextColor(0,0,0);$pdf->SetFillColor(150,190,252);//BLUE 150,190,252
      $pdf->Cell(23,6,$total_estimados,'LRTB',0,'C',true);
      $pdf->Cell(23,6,$total_inscritos,'LRTB',0,'C',true);
      $total_nivel_estimados+=$total_estimados;
      $total_nivel_inscritos+=$total_inscritos;
      $pdf->Ln();
    // } // Cerramos el comentario del if($count>=$begin)
    $count++;
    // MODIFICADO: Eliminamos los breaks que limitan los niveles
    // if($alumno_nivel==1&&$count>4)break;
    // if($alumno_nivel==2&&$count>4)break;
    // if($alumno_nivel==3&&$count>10)break;
  }

  $pdf->Cell(22,6,"TOTALES",'LRTB',0,'L',true);
  $pdf->Cell(20,6,$sum_ri_estimados,'LRTB',0,'C',false);
  $pdf->Cell(20,6,$sum_ri_inscritos,'LRTB',0,'C',false);
  $pdf->Cell(20,6,$sum_ri_diferencia,'LRTB',0,'C',true);
  $pdf->Cell(20,6,$sum_ni_estimados,'LRTB',0,'C',false);
  $pdf->Cell(20,6,$sum_ni_inscritos,'LRTB',0,'C',false);
  $pdf->Cell(20,6,$sum_ni_diferencia,'LRTB',0,'C',true);
  $pdf->Cell(23,6,$total_nivel_estimados,'LRTB',0,'C',true);
  $pdf->Cell(23,6,$total_nivel_inscritos,'LRTB',0,'C',true);
  $pdf->Ln();

  $pdf->SetTextColor(255,255,255);$pdf->SetFillColor(38,80,142);//COBALTO 38,80,142
  $pdf->Ln();
  $pdf->Cell(82,6,"Donde: NI= Nuevo Ingreso; RI= Reinscritos",'LRTB',0,'L',true);

  $pdf->Output();

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //   Funciones   Funciones   Funciones   Funciones   Funciones   Funciones   Funciones   Funciones   Funciones   Funciones   Funciones   //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  
  function getSchoolYear($nce){//Determina ciclo escolar por paramero numerico if($nce==12)$cei=2015;
    // $nce-=12;// $cei=2015+$nce;
    $cei=2003+$nce;
    $ce="$cei - ".($cei+1);
    return $ce;
  }

  
  function get_Date($date)//Format YYYY-MM-DD
  {
    list($day, $month, $year) = explode('-', $date);
    $month = $month < 10 ? $month[1] : $month;
    $months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    $strdate=$day." de ".$months[$month]." de ".$year;
    return $strdate;
  }

  function getFullLevel($lvl,$grade){
    $lvls =['', 'Maternal ', 'Kinder-', '° Primaria', '° Secundaria'];
    $grades = ['', 'A', 'B'];
    
    $full = $lvl == 1 ? $lvls[$lvl].$grades[$grade] : (
            $lvl == 2 ? $lvls[$lvl].$grade : (
            $lvl == 3 ? $grade.$lvls[$lvl] : (
            $lvl == 4 ? $grade.$lvls[$lvl] : (
            'EGRESADO'.$lvl))));
   

   return utf8_decode($full);
  }

  function cambiadeciclo($row){
    $newrow = array();
    $index[] = [1,2]; //maternal
    $index[] = [2,3]; //kinder
    $index[] = [3,6]; //primaria
    $index[] = [4,3]; //secundaria
    
    for ($i=1; $i <= 4; $i++) { //Se inicializa el nuevo registro con los valores en 0
      for ($j=1; $j <= $index[$i-1][1] ; $j++) { 
        $newrow[] = [$i, $j, 0]; 
      }
    }    

    // Comentado: Los alumnos ya están migrados al ciclo correcto (22)
    /*
    if (date("m")<8) 
    foreach ($row as $k => $r) { //se actualizan los grados
      if ($r[0]==1 && $r[1]==2) {$row[$k][0]=2; $row[$k][1]=0;} //pasa de maternal a kinder
      if ($r[0]==2 && $r[1]==3) {$row[$k][0]=3; $row[$k][1]=0;} //pasa de kinder a primaria
      if ($r[0]==3 && $r[1]==6) {$row[$k][0]=4; $row[$k][1]=0;} //pasa de prmiaria a secundaria
      $row[$k][1]++;  //pasa de grado
    }
    */     

    foreach ($row as $l => $r) { //se unen ambos registros
      foreach ($newrow as $m => $nr) {
        if ($r[0]==$nr[0] && $r[1]==$nr[1]){ //si son el mismo grado y grupo
          $newrow[$m][2]=$row[$l][2];   //se sustituye el valor de 0 por el de la base de datos
        }
      }
    }

    return $newrow;
  }

  function disminuirGrado($array){
    foreach ($array as $i => $value) {
      if ($value[1]==4 && $value[0] == 1){
        $array[$i][0]=3;
        $array[$i][1]=6;
      }
      else{
        $array[$i][1]--;
      }
    }
    return $array;
  }
?>
