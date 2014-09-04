let identToLit = macro {
    case {_
        $name
    } => {
        letstx $name_str = [makeValue(unwrapSyntax(#{$name}), #{here})];
        return #{
            $name_str
        }
    }
}

macro type {
  rule { $name:ident struct { $($field:ident : $type:expr) (,) ... } } => {
    var $name = struct({
        $($field: $type,) ...
    }, identToLit $name);
  }
  rule { $name:ident union { $($type:expr) (,) ... } } => {
    var $name = union([
        $($type,) ...
    ], identToLit $name);
  }
  rule { $name:ident tuple { $($type:expr) (,) ... } } => {
    var $name = tuple([
        $($type,) ...
    ], identToLit $name);
  }
  rule { $name:ident enums { $($lit:lit : $value:expr) (,) ... } } => {
    var $name = enums({
        $($lit: $value,) ...
    }, identToLit $name);
  }
  rule { $name:ident enums { $($lit:lit) (,) ... } } => {
    var $name = enums.of([
        $($lit,) ...
    ], identToLit $name);
  }
  rule { $name:ident subtype '<' $subtype:ident '>' $x:ident { $body ... } } => {
    var $name = subtype($subtype, function ($x) {
        $body ...
    }, identToLit $name);
  }
  rule { $name:ident irriducible $x:ident { $body ... } } => {
    var $name = irriducible(function ($x) {
        $body ...
    }, identToLit $name);
  }
  rule { $name:ident maybe '<' $type:ident '>' } => {
    var $name = maybe($type, identToLit $name);
  }
  rule { $name:ident list '<' $type:ident '>' } => {
    var $name = list($type, identToLit $name);
  }
  rule { $name:ident dict '<' $type:ident '>' } => {
    var $name = dict($type, identToLit $name);
  }
}

macro fn {
  rule { $name:ident ( $($param:ident : $type:ident) (,) ... ) -> $return:ident { $body ... } } => {
    var $name = func([$($type,) ...], function ($($param,) ...) {
      $body ...
    }, $return);
  }
  rule { $name:ident ( $($param:ident : $type:ident) (,) ... ) { $body ... } } => {
    var $name = func([$($type,) ...], function ($($param,) ...) {
      $body ...
    });
  }
}